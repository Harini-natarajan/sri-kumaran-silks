import React, { createContext, useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { setAuthToken, setTokenGetter } from '../services/api';




export const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
    const { user: clerkUser, isLoaded } = useUser();
    const { signOut, getToken } = useAuth();
    const [cartItems, setCartItems] = useState([]);

    const [user, setUser] = useState(null);
    const [wishlist, setWishlist] = useState([]);


    // Load from local storage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('cartItems');
        if (savedCart) {
            setCartItems(JSON.parse(savedCart));
        }

        const savedWishlist = localStorage.getItem('wishlist');
        if (savedWishlist) {
            setWishlist(JSON.parse(savedWishlist));
        }
    }, []);

    // Set up token getter for API calls and sync Clerk user
    useEffect(() => {
        if (isLoaded) {
            if (clerkUser) {
                // Set the token getter so API interceptor can get fresh tokens
                setTokenGetter(getToken);

                // Also set initial token for backwards compatibility
                getToken().then(token => {
                    setAuthToken(token);
                });

                setUser({
                    _id: clerkUser.id,
                    name: clerkUser.fullName,
                    email: clerkUser.primaryEmailAddress?.emailAddress,
                    isAdmin: clerkUser.publicMetadata?.isAdmin || false,
                    picture: clerkUser.imageUrl
                });
            } else {
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

    const addToCart = (product, qty = 1) => {
        const existingItem = cartItems.find(item => item._id === product._id);

        if (existingItem) {
            setCartItems(cartItems.map(item =>
                item._id === product._id
                    ? { ...item, quantity: item.quantity + qty }
                    : item
            ));
        } else {
            setCartItems([...cartItems, { ...product, quantity: qty }]);
        }
    };

    const removeFromCart = (id) => {
        setCartItems(cartItems.filter(item => item._id !== id));
    };

    const updateQuantity = (id, newQty) => {
        if (newQty < 1) return;
        setCartItems(cartItems.map(item =>
            item._id === id ? { ...item, quantity: newQty } : item
        ));
    };

    const clearCart = () => {
        setCartItems([]);
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
            wishlist,
            addToWishlist,
            removeFromWishlist,
            isInWishlist,
            toggleWishlist
        }}>
            {children}
        </ShopContext.Provider>
    );
};
