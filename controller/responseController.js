module.exports = {
    successCallBack: (res, body) => {
        res.set({ 'content-type': 'application/json; charset=utf-8' });
        res.status(200).send({
            status: 'success',
            ...body,
        });
    },
    errorCallBack: (res, body, errorCode) => {
        res.set({ 'content-type': 'application/json; charset=utf-8' });
        res.status(errorCode || 500).send({
            status: 'failure',
            ...body,
        });
    },
}