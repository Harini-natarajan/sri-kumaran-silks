import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    XCircle,
    ArrowLeft,
    RefreshCw,
    MessageCircle,
    CreditCard,
    AlertTriangle,
    HelpCircle,
    Phone,
    Mail
} from 'lucide-react';
import { motion } from 'framer-motion';

const PaymentFailed = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const errorMessage = location.state?.error || 'Your payment could not be processed';
    const orderId = location.state?.orderId;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: 'easeOut' }
        }
    };

    const iconVariants = {
        hidden: { scale: 0, rotate: -180 },
        visible: {
            scale: 1,
            rotate: 0,
            transition: {
                type: 'spring',
                stiffness: 200,
                damping: 15,
                delay: 0.3
            }
        }
    };

    const commonIssues = [
        {
            icon: CreditCard,
            title: 'Card Declined',
            description: 'Check if your card has sufficient balance or if there are any restrictions.'
        },
        {
            icon: AlertTriangle,
            title: 'Transaction Timeout',
            description: 'The payment session may have expired. Please try again.'
        },
        {
            icon: HelpCircle,
            title: 'Bank Verification',
            description: 'Your bank may require additional verification. Check your messages.'
        }
    ];

    return (
        <div className="bg-gradient-to-b from-red-50 via-white to-gray-50 dark:from-gray-900 dark:via-slate-950 dark:to-slate-950 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <motion.div
                className="max-w-2xl mx-auto"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Error Header */}
                <motion.div
                    className="text-center mb-10"
                    variants={itemVariants}
                >
                    <motion.div
                        variants={iconVariants}
                        className="w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-500/30"
                    >
                        <XCircle className="text-white" size={48} />
                    </motion.div>
                    <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 dark:text-white mb-3">
                        Payment Failed
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                        {errorMessage}
                    </p>
                </motion.div>

                {/* Error Details Card */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-8"
                >
                    <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30 p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
                            </div>
                            <div>
                                <h2 className="font-medium text-gray-900 dark:text-white mb-1">
                                    Don't worry, no money was deducted
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    If any amount was debited, it will be refunded within 5-7 business days.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* What to do next */}
                    <div className="p-6">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-4">What you can do:</h3>
                        <div className="space-y-4">
                            {commonIssues.map((issue, index) => (
                                <div
                                    key={index}
                                    className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                >
                                    <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                                        <issue.icon className="text-gray-600 dark:text-gray-300" size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">{issue.title}</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{issue.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    variants={itemVariants}
                    className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
                >
                    <button
                        onClick={() => navigate('/checkout')}
                        className="btn-primary inline-flex items-center justify-center gap-2 py-4 px-8 shadow-lg hover:shadow-xl transition-all"
                    >
                        <RefreshCw size={18} />
                        Try Again
                    </button>
                    <Link
                        to="/cart"
                        className="btn-secondary inline-flex items-center justify-center gap-2 py-4 px-8"
                    >
                        <ArrowLeft size={18} />
                        Back to Cart
                    </Link>
                </motion.div>

                {/* Need Help Section */}
                <motion.div
                    variants={itemVariants}
                    className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 rounded-xl p-6"
                >
                    <div className="text-center mb-4">
                        <MessageCircle className="mx-auto text-primary mb-2" size={28} />
                        <h3 className="font-medium text-gray-900 dark:text-white">Need Help?</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Our support team is here to assist you</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="tel:+919876543210"
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all text-gray-700 dark:text-gray-300"
                        >
                            <Phone size={18} className="text-primary" />
                            +91 98765 43210
                        </a>
                        <a
                            href="mailto:support@kumaransilks.com"
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all text-gray-700 dark:text-gray-300"
                        >
                            <Mail size={18} className="text-primary" />
                            support@kumaransilks.com
                        </a>
                    </div>
                </motion.div>

                {/* Order Reference */}
                {orderId && (
                    <motion.div
                        variants={itemVariants}
                        className="text-center mt-8"
                    >
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Reference ID: <span className="font-mono">{orderId}</span>
                        </p>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default PaymentFailed;
