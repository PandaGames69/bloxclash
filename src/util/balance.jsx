export function getCents(bal) {
    if (typeof bal !== "number") { return '00' }

    bal = Math.abs(bal)
    let cents = Math.floor(Math.round(bal % 1 * 100))
    if (cents < 10) { return '0' + cents }
    return cents
}