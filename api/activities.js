const { ObjectId } = require('mongodb');
const { getDb } = require('./_db');

const cors = (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

const serial = doc => ({ ...doc, _id: doc._id.toString() });

module.exports = async function(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    try {
        const db  = await getDb();
        const col = db.collection('activityList');

        if (req.method === 'GET') {
            const docs = await col.find({}).sort({ name: 1 }).toArray();
            return res.json(docs.map(serial));
        }

        if (req.method === 'POST') {
            const { name, coins } = req.body;
            if (!name)  return res.status(400).json({ error: 'name required' });
            if (!coins) return res.status(400).json({ error: 'coins required' });
            const doc = { name, coins: parseInt(coins) };
            const r = await col.insertOne(doc);
            return res.json(serial({ _id: r.insertedId, ...doc }));
        }

        if (req.method === 'PUT') {
            const { _id, ...rest } = req.body;
            if (!_id) return res.status(400).json({ error: '_id required' });
            if (rest.coins) rest.coins = parseInt(rest.coins);
            await col.updateOne({ _id: new ObjectId(_id) }, { $set: rest });
            return res.json({ ok: true });
        }

        if (req.method === 'DELETE') {
            const { id } = req.query;
            if (!id) return res.status(400).json({ error: 'id required' });
            await col.deleteOne({ _id: new ObjectId(id) });
            return res.json({ ok: true });
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
