const express = require('express');
const { getThumbnails } = require('../utils/roblox');
const { items } = require('../utils/roblox/items');
// const { cacheRes } = require('../utils');

const cachedItemImgs = {};
const router = express.Router();

router.get('/:id/img', async (req, res) => {

    const itemId = parseInt(req.params.id);
    if (isNaN(itemId)) return res.status(400).json({ error: 'INVALID_ITEM_ID' });

    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('Surrogate-Control', 'public, max-age=31536000');

    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    res.setHeader('Expires', date.toUTCString());

    const cached = items[itemId]?.img || cachedItemImgs[itemId];
    if (cached) return res.redirect(cached);

    try {

        const data = await getThumbnails([
            {
                "requestId": `${itemId}::Asset:420x420:png:regular`,
                "type": "Asset",
                "targetId": itemId,
                "token": "",
                "format": "png",
                "size": "420x420"
            },
            {
                "requestId": `${itemId}::BundleThumbnail:420x420:png:regular`,
                "type": "BundleThumbnail",
                "targetId": itemId,
                "token": "",
                "format": "png",
                "size": "420x420"
            }
        ]);

        const url = data?.data?.[0]?.imageUrl || data?.data?.[1]?.imageUrl;
        
        if (!url) {
            // console.log(data);
            return res.status(404).json({ error: 'ITEM_NOT_FOUND' });
        }

        cachedItemImgs[itemId] = url;
        res.redirect(url);

    } catch (e) {
        console.error(e)
        res.status(404).json({ error: 'ITEM_NOT_FOUND' });
    }

    // res.redirect(`https://www.roblox.com/bust-thumbnail/image?userId=${req.params.id}&width=420&height=420&format=png`);
    // res.redirect(`https://www.roblox.com/headshot-thumbnail/image?userId=${req.params.id}&width=420&height=420&format=png`)
        
});

module.exports = router;