export let subscriptions = []

export function subscribeToGame(ws, name) {
    ws.emit(`${name}:subscribe`)
    subscriptions.push(name)
}

export function unsubscribeFromGames(ws) {
    subscriptions.forEach(game => ws.emit(`${game}:unsubscribe`))
    subscriptions = []
}