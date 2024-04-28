import {api, authedAPI, createNotification, fetchUser, getJWT} from "../util/api";
import {createContext, createResource, createSignal, useContext} from "solid-js";

const UserContext = createContext();

export function UserProvider(props) {

    const [fetched, setFetched] = createSignal(false)
    const [user, { mutate }] = createResource(getUser), userData = [user, {
        mutateUser(newUser) {
            mutate(newUser)
        },
        setBalance(newBal) {
            let newUser = user()
            newUser.balance = newBal
            mutate({
                ...newUser
            })
        },
        setNotifications(newNotis) {
            let newUser = user()
            newUser.notifications = newNotis
            mutate({
                ...newUser
            })
        },
        setXP(xp) {
            let newUser = user()
            newUser.xp = xp
            mutate({
                ...newUser
            })
        },
        getUser() {
            return user()
        },
        hasFetched() {
            return fetched()
        }
    }]

    async function getUser() {
        let jwt = getJWT()
        if (!jwt || jwt?.length < 1) {
            setFetched(true)
            return null
        }

        try {
            let data = await fetchUser()
            mutate(data)
            setFetched(true)

            if (data) {
                // CRISP LIVE CHAT
                $crisp.push(["set", "user:nickname", [data.username]]);

                $crisp.push(["set", "session:data", [[
                    ["user-id", data.id]
                ]]]);
            }

            return data
        } catch (e) {
            mutate(null)
            setFetched(true)
            console.log(e)
            return null
        }
    }

    return (
        <UserContext.Provider value={userData}>
            {props.children}
        </UserContext.Provider>
    );
}

export function useUser() { return useContext(UserContext); }