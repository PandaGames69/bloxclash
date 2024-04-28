export function numberToColor(num) {
    switch(num) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
            return 'green'
        case 14:
        case 13:
        case 12:
        case 11:
        case 10:
        case 9:
        case 8:
            return 'red'
        case 0:
        default:
            return 'gold'
    }
}