export function addPage(newData, page, setter) {
    return setter(data => {
        data[page] = newData
        return data
    })
}