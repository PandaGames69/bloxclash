const { sql } = require('../../../database');
const slots = {};
const hacksawTokens = {};

async function cacheSlots() {

    const [all] = await sql.query(`SELECT * FROM slots ORDER BY id ASC`);
    all.forEach(e => slots[e.slug] = e);

}

module.exports = {
    slots,
    hacksawTokens,
    cacheSlots
}