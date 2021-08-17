function parseTime(ms) {
    if (ms > 1000 * 60 * 60) {
        const h = Math.floor(ms / (1000 * 60 * 60));
        return h + (h > 1 ? ' hrs' : ' hr')
    } else if (ms > 1000 * 60) { //minutes
        const h = Math.floor(ms / (1000 * 60));
        return h + (h > 1 ? ' mins' : ' min')
    } else if (ms > 1000) {
        const h = Math.floor(ms / (1000));
        return h + (h > 1 ? ' secs' : ' sec')
    }
    return ms + ' ms'
}