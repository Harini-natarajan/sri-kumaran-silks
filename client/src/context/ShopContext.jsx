import React, { createContext, useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { setAuthToken, setTokenGetter, getUserProfile } from '../services/api';
import { useSocket } from './SocketContext';




export const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
    const { user: clerkUser, isLoaded } = useUser();
    const { signOut, getToken } = useAuth();
    const [cartItems, setCartItems] = useState(() => {
        const savedCart = localStorage.getItem('cartItems');
        return savedCart ? JSON.parse(savedCart) : [];
    });
    const [user, setUser] = useState(null);
    const [wishlist, setWishlist] = useState(() => {
        const savedWishlist = localStorage.getItem('wishlist');
        return savedWishlist ? JSON.parse(savedWishlist) : [];
    });
    const [isFirstOrder, setIsFirstOrder] = useState(() => {
        return localStorage.getItem('hasPlacedOrder') !== 'true';
    });
    const socket = useSocket();


    // Note: State now loads directly from localStorage during initialization to prevent empty state overwrites.

    // Set up token getter for API calls and sync Clerk user
    useEffect(() => {
        if (isLoaded) {
            if (clerkUser) {
                console.log('[ShopContext] Setting up authentication for user:', clerkUser.id);
                // Set the token getter so API interceptor can get fresh tokens
                setTokenGetter(getToken);
                console.log('[ShopContext] TokenGetter configured');

                // Also set initial token for backwards compatibility
                getToken().then(token => {
                    if (token) {
                        console.log('[ShopContext] Initial token obtained');
                        setAuthToken(token);
                    } else {
                        console.warn('[ShopContext] getToken() returned null/undefined');
                    }
                }).catch(err => {
                    console.error('[ShopContext] Error getting initial token:', err);
                });

                // Fetch extended user profile from our MongoDB database 
                // to get loyalty points and other custom fields not in Clerk
                getUserProfile().then(res => {
                    setUser({
                        ...res.data, // Merges loyaltyPoints, lifetimeEarnedPoints, etc.
                        _id: clerkUser.id, // Ensure Clerk ID stays intact just in case
                        picture: clerkUser.imageUrl
                    });
                    console.log('[ShopContext] User state set with custom DB fields');
                }).catch(err => {
                    console.error('[ShopContext] Error fetching extended profile, falling back to Clerk data:', err);
                    setUser({
                        _id: clerkUser.id,
                        name: clerkUser.fullName,
                        email: clerkUser.primaryEmailAddress?.emailAddress,
                        isAdmin: clerkUser.publicMetadata?.isAdmin || false,
                        picture: clerkUser.imageUrl
                    });
                });
                console.log('[ShopContext] User state set');
            } else {
                console.log('[ShopContext] No clerk user, clearing auth');
                setUser(null);
                setAuthToken(null);
                setTokenGetter(null);
            }
        }
    }, [clerkUser, isLoaded, getToken]);



    // Save cart to local storage on change
    useEffect(() => {
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }, [cartItems]);

    // Save user to local storage on change (optional, keeping it for compatibility)
    useEffect(() => {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            localStorage.removeItem('user');
        }
    }, [user]);


    // Save wishlist to local storage on change
    useEffect(() => {
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }, [wishlist]);

    // Live stock synchronization for cart
    useEffect(() => {
        if (socket) {
            socket.on('stockUpdate', ({ productId, countInStock }) => {
                setCartItems(prevCart => {
                    return prevCart.map(item => {
                        if (item._id === productId || String(item._id) === String(productId)) {
                            // If user has more in cart than available, reduce it
                            const newQty = Math.min(item.quantity, countInStock);
                            return { ...item, countInStock, quantity: newQty };
                        }
                        return item;
                    });
                });
            });

            return () => {
                socket.off('stockUpdate');
            };
        }
    }, [socket]);

    const addToCart = (product, qty = 1) => {
        const existingItem = cartItems.find(item => item._id === product._id);
        const currentQty = existingItem ? existingItem.quantity : 0;
        const totalRequested = currentQty + qty;

        // Check against countInStock if available
        if (product.countInStock !== undefined && totalRequested > product.countInStock) {
            // If they are already at max, don't add more
            if (currentQty >= product.countInStock) return false;
            
            // Otherwise, set to max available
            setCartItems(cartItems.map(item =>
                item._id === product._id
                    ? { ...item, quantity: product.countInStock }
                    : item
            ));
            return true;
        }

        if (existingItem) {
            setCartItems(cartItems.map(item =>
                item._id === product._id
                    ? { ...item, quantity: item.quantity + qty }
                    : item
            ));
        } else {
            setCartItems([...cartItems, { ...product, quantity: qty }]);
        }
        return true;
    };

    const removeFromCart = (id) => {
        setCartItems(cartItems.filter(item => item._id !== id));
    };

    const updateQuantity = (id, newQty) => {
        if (newQty < 1) return;
        
        setCartItems(cartItems.map(item => {
            if (item._id === id) {
                // Check stock during update
                const max = item.countInStock !== undefined ? item.countInStock : 99;
                return { ...item, quantity: Math.min(newQty, max) };
            }
            return item;
        }));
    };

    const clearCart = () => {
        setCartItems([]);
        // After first successful order, discount no longer applies
        setIsFirstOrder(false);
        localStorage.setItem('hasPlacedOrder', 'true');
    };

    // Wishlist functions
    const addToWishlist = (product) => {
        const exists = wishlist.find(item => item._id === product._id);
        if (!exists) {
            setWishlist([...wishlist, product]);
        }
    };

    const removeFromWishlist = (id) => {
        setWishlist(wishlist.filter(item => item._id !== id));
    };

    const isInWishlist = (id) => {
        return wishlist.some(item => item._id === id);
    };

    const toggleWishlist = (product) => {
        if (isInWishlist(product._id)) {
            removeFromWishlist(product._id);
        } else {
            addToWishlist(product);
        }
    };

    const login = (userData) => {
        // User is handled by Clerk now, but keeping this for legacy calls if any
        setUser(userData);
    };

    const logout = async () => {
        await signOut();
        setUser(null);
        localStorage.removeItem('token');
    };


    const refreshUser = async () => {
        if (!clerkUser) return;
        try {
            const res = await getUserProfile();
            setUser({
                ...res.data,
                _id: clerkUser.id,
                picture: clerkUser.imageUrl
            });
        } catch (err) {
            console.error('Failed to refetch user profile details:', err);
        }
    };

    return (
        <ShopContext.Provider value={{
        cartItems,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            user,
            login,
            logout,
            refreshUser,
            wishlist,
            addToWishlist,
            removeFromWishlist,
            isInWishlist,
            toggleWishlist,
            isFirstOrder,
        }}>
            {children}
        </ShopContext.Provider>
    );
};
