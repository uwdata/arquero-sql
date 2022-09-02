(async () => {
    try {
        new Promise(resolve => {
            throw new Error('error here');
        }).catch(e => e);
    } catch (e) {
        // console.log(e);
    }
})();