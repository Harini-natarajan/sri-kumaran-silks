import React, { createContext, useState, useEffect } from 'react'
import { useUser, useAuth } from '@clerk/clerk-react'
import { setAuthToken, setGetTokenFunction } from '../services/api'

export const AdminContext = createContext()

export const AdminProvider = ({ children }) => {
    const { user: clerkUser, isLoaded } = useUser()
    const { signOut, getToken } = useAuth()
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // Pass getToken to API service for fresh tokens on each request
    useEffect(() => {
        if (getToken) {
            setGetTokenFunction(getToken)
        }
    }, [getToken])

    // Sync Clerk user with context
    useEffect(() => {
        const updateUser = async () => {
            if (isLoaded) {
                if (clerkUser) {
                    setUser({
                        _id: clerkUser.id,
                        name: clerkUser.fullName,
                        email: clerkUser.primaryEmailAddress?.emailAddress,
                        isAdmin: clerkUser.publicMetadata?.isAdmin || false,
                        picture: clerkUser.imageUrl
                    })
                } else {
                    setUser(null)
                }
                setLoading(false)
            }
        }
        updateUser()
    }, [clerkUser, isLoaded])

    const logout = async () => {
        await signOut()
        setUser(null)
        setGetTokenFunction(null)
    }

    return (
        <AdminContext.Provider value={{
            user,
            loading,
            logout,
            isAdmin: user?.isAdmin || false
        }}>
            {children}
        </AdminContext.Provider>
    )
}

