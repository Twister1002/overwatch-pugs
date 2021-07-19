type Command = {
    name: string,
    isModCommand: boolean,
    help: { ow: string, val: string },
    args: { ow: string, val: string }
}