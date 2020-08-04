export function toJson (str:any) {
    try {
        return JSON.parse(str)

    }catch(error) {
        return undefined
    }
}