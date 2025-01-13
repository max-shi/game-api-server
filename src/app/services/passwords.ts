const hash = async (password: string): Promise<string> => {
    // todo: password hashing and comparing are left to you
    return password;
}

const compare = async (password: string, comp: string): Promise<boolean> => {
    // todo: password hashing and comparing are left to you
    return password === comp
}

export {hash, compare}