export default function dateTime(format: string, date?: Date): string {
    const currDate: Date = date ? date : new Date();

    function parseChar(x: string) {
        switch (x) {
            case "d":
                return currDate.getDate().toString().padStart(2, "0");
                break;
            case "m": 
                return (currDate.getMonth() + 1).toString().padStart(2, "0");
                break;
            case "Y":
                return currDate.getFullYear().toString().padStart(4, "0");
                break;
            case "H":
                return currDate.getHours().toString().padStart(2, "0");
                break;
            case "i":
                return currDate.getMinutes().toString().padStart(2, "0");
                break;
            case "s":
                return currDate.getSeconds().toString().padStart(2, "0");
                break;
            default:
                return x;
                break; 
        }
    }

    return format.split('').map(x => parseChar(x)).join("");
}