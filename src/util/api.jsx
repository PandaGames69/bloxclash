import {toast} from "solid-toast";
import {errors} from "../resources/errors";

export const dropdowns = []

export function createNotification(type, message, options) {
    if (type === 'success') {
        return toast.success(message, options)
    } else if (type === 'error') {
        return toast.error(message, options)
    }
    return toast(message, options)
}

export async function api(path, method, body, notification = false, headers =  { 'Content-Type': 'application/json' }) {
    try {
        let res = await fetch(`${import.meta.env.VITE_SERVER_URL}${path}`, {
            method,
            headers,
            body,
        })
        let data = await res.json()

        if (data.error && notification) {
            toast.error(errors[data.error] || data.error)
        } else if (data.error && data.error === 'DISABLED') {
            toast.error(errors[data.error] || data.error)
        }

        return data
    } catch (e) {
        console.log('There was an error when trying to fetch ' + path, e)
        return null
    }
}

export async function authedAPI(path, method, body, notification = false) {
    return await api(path, method, body, notification, { 'Authorization': getJWT(), 'Content-Type': 'application/json' })
}

export async function fetchUser() {
    let user = await api('/user', 'GET', null, false, { 'Authorization': getJWT() })
    return user?.error ? null : user
}

export function addDropdown(setValue) {
    dropdowns.push(setValue)
}

export function closeDropdowns() {
    dropdowns.forEach(dropdown => dropdown(false))
}

export function getRandomNumber(min, max, chance) {
    const range = max - min + 1

    if (!chance)
        return Math.floor(Math.random() * range) + min;
    return Math.floor(chance.random() * range) + min;
}

export function getJWT() {
    return document.cookie.split("; ").find((row) => row.startsWith("jwt="))?.split("=")[1] || ''
}

export function logout() {
    document.cookie = `jwt= ; SameSite=Lax; Secure; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    window.location.reload()
}