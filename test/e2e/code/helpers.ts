export async function pauseFor(time: number) {
    return new Promise(resolve => setTimeout(resolve, time));
}
