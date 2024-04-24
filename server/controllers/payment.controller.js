import AppError from "../utils/error.util.js";
import {razorpay} from '../server.js';
import Payment from "../models/payment.model.js";
export  const getRazorpayApiKey = async (req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            message: 'razorpay api key',
            key: ProcessingInstruction.env.RAZORPAY_KEY_ID
        });
    } catch (e) {
        return next(
            new AppError(e.message, 500)
        )
    }
}

export  const buySubscription = async (req, res, next) => {
    try {
        const { id } = req.user;
    const user = await User.findById(id);

    if(!user)
    {
        return next(
            new AppError('unauthorized, please login')
        )
    }
    if (user.role === 'ADMIN')
    {
        return next(
            new AppError(
                'Admin cannot purchase a subscription', 400
            )
        )
    }
    
    const subscription = await razorpay.subscription.create({
        plan_id: process.env.RAZORPAY_PLAN_ID,
        customer_notify: 1
    });

    user.subscription.id = subscription.id;
    user.subscription.status = subscription.status;

    await user.save();

    res.status(200).json({
        success: true,
        message: "subscribed successfully",
        subscription_id: subscription_id
    });  

        
    } catch (e) {
        return next(
            new AppError(e.message, 500)
        )
    }
}

export  const verifySubscription = async (req, res, next) => {
    try {
        const { id } = req.user;
    const { razorpay_payment_id, razorpay_signature, razorpay_subscription_id } = req.body;
    
    const user = await User.findById(id);
    if(!user)
    {
        return next(
            new AppError('unauthorized, please login')
        )
    }

    const subscriptionId = user.subscription.id;

    const generatedSignature = crypto
           .createHmac('sha256', process.env.RAZORPAY_SECRET)
           .update(`${razorpay_payment_id}|${subscriptionId}`)
           .digest('hex');

           if(generatedSignature !== razorpay_signature)
           {
            return next(
                new AppError('payment not verified, please try again', 500)
            )
           }

           await Payment.create({
            razorpay_payment_id,
            razorpay_signature,
            razorpay_subscription_id,

           });

           user.subscription.status = 'active';
           await user.save();

           res.status(200).json({
            success: true,
            message: 'payment verified successfully!'
           })

    } catch (e) {
        return next(
            new AppError(e.message, 500)
        )
    }
}

export  const cancelSubscription = async (req, res, next) => {
    try {
        const { id } = req.user;

    const user = await User.findById(id);

    if(!user)
    {
        return next(
            new AppError('unauthorized, please login')
        )
    }
    if (user.role === 'ADMIN')
    {
        return next(
            new AppError(
                'Admin cannot purchase a subscription', 400
            )
        )
    }

    const subscriptionId = user.subscription.id;

    user.subscription.status = subscription.status;
    await user.save();

    } catch (e) {
        return next(
            new AppError(e.message, 500)
        )
        
    }
}

export  const allPayments = async (req, res, next) => {
    try {
        const { count } = req.query;

    const subscriptions = await razorpay.subscription.all({
        count: count || 10,
    });

    res.status(200).json({
        success: true,
        message: 'all payments',
        subscriptions
    })
        
    } catch (e) {
        
        return next(
            new AppError(e.message, 500)
        )
    }
}
