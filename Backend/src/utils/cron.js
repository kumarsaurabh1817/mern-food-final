import cron from 'node-cron';
import Shop from '../models/Shop.js';
import Order from '../models/Order.js';
import DeliveryProfile from '../models/DeliveryProfile.js';

// ─── Every 5 minutes: auto-open/close shops based on operating hours ──────────
// NOTE: Shop operatingHours are stored in local time (IST, UTC+5:30) by owners.
// We use local server time (getHours/getMinutes) so the comparison matches.
// If the server runs in UTC, set the TZ env variable to 'Asia/Kolkata' in your
// hosting provider / process manager so Node.js local time is correct.
cron.schedule('*/5 * * * *', async () => {
    try {
        const shops = await Shop.find({ isApproved: true, isSuspended: false }, 'isOpen operatingHours').lean();
        const now = new Date();

        // Use LOCAL server time, not UTC. Shop hours are entered by owners in their
        // local timezone (IST). Make sure TZ=Asia/Kolkata is set on the server.
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTime = currentHours * 60 + currentMinutes;

        const openShopIds = [];
        const closeShopIds = [];

        for (const shop of shops) {
            if (shop.operatingHours && shop.operatingHours.open && shop.operatingHours.close) {
                const [openH, openM] = shop.operatingHours.open.split(':').map(Number);
                const [closeH, closeM] = shop.operatingHours.close.split(':').map(Number);
                
                const openTime = openH * 60 + openM;
                const closeTime = closeH * 60 + closeM;

                let shouldBeOpen = false;

                if (openTime <= closeTime) {
                    // Normal case: shop opens and closes on the same day
                    shouldBeOpen = currentTime >= openTime && currentTime <= closeTime;
                } else {
                    // Overnight case: e.g. 22:00 – 02:00 crosses midnight
                    shouldBeOpen = currentTime >= openTime || currentTime <= closeTime;
                }

                if (shop.isOpen !== shouldBeOpen) {
                    if (shouldBeOpen) openShopIds.push(shop._id);
                    else closeShopIds.push(shop._id);
                }
            }
        }

        if (openShopIds.length > 0) {
            await Shop.updateMany({ _id: { $in: openShopIds } }, { $set: { isOpen: true } });
            console.log(`[CRON] Auto-opened ${openShopIds.length} shops`);
        }
        if (closeShopIds.length > 0) {
            await Shop.updateMany({ _id: { $in: closeShopIds } }, { $set: { isOpen: false } });
            console.log(`[CRON] Auto-closed ${closeShopIds.length} shops`);
        }
    } catch (error) {
        console.error('Error running shop auto-close cron job:', error);
    }
});

// ─── Every 10 minutes: auto-cancel stale online orders still pending ─────────
cron.schedule('*/10 * * * *', async () => {
    try {
        const cutoff = new Date(Date.now() - 30 * 60 * 1000);
        const result = await Order.updateMany(
            {
                status: 'pending',
                paymentMethod: 'online',
                paymentStatus: 'pending',
                createdAt: { $lte: cutoff },
            },
            {
                $set: {
                    status: 'cancelled',
                    paymentStatus: 'failed',
                    'statusTimestamps.cancelled': new Date(),
                },
            },
        );

        if (result.modifiedCount > 0) {
            console.log(`[CRON] Auto-cancelled ${result.modifiedCount} stale online order(s).`);
        }
    } catch (error) {
        console.error('[CRON] Error auto-cancelling stale online orders:', error);
    }
});

// ─── FIX #10: Daily at 3 AM — prune stale rejectedOrders from delivery profiles ─
cron.schedule('0 3 * * *', async () => {
    try {
        // Find all order IDs that are delivered or cancelled (i.e., stale rejections)
        const staleOrders = await Order.find({
            status: { $in: ['delivered', 'cancelled'] }
        }).distinct('_id');

        if (staleOrders.length === 0) return;

        const result = await DeliveryProfile.updateMany(
            { rejectedOrders: { $in: staleOrders } },
            { $pull: { rejectedOrders: { $in: staleOrders } } }
        );

        console.log(`[CRON] Pruned stale rejectedOrders from ${result.modifiedCount} delivery profile(s).`);
    } catch (error) {
        console.error('[CRON] Error pruning rejectedOrders:', error);
    }
});
