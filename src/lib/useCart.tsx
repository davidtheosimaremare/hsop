"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface CartItem {
    id: string | number;
    sku: string;
    name: string;
    brand: string;
    price: number;
    quantity: number;
    image: string | null;
    availableToSell: number;
    originalPrice?: number;
    stockStatus?: 'READY' | 'INDENT';
    originalId?: string | number;
}

interface CartContextType {
    items: CartItem[];
    addItem: (product: Omit<CartItem, 'quantity'>, quantity?: number) => void;
    removeItem: (productId: string | number) => void;
    updateQuantity: (productId: string | number, quantity: number) => void;

    clearCart: () => void;
    totalItems: number;
    totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "hsop-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load cart from localStorage on mount
    useEffect(() => {
        try {
            const storedCart = localStorage.getItem(CART_STORAGE_KEY);
            if (storedCart) {
                const parsed = JSON.parse(storedCart);
                if (Array.isArray(parsed)) {
                    setItems(parsed);
                }
            }
        } catch (error) {
            console.error("Failed to load cart from localStorage:", error);
        }
        setIsInitialized(true);
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (isInitialized) {
            try {
                localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
            } catch (error) {
                console.error("Failed to save cart to localStorage:", error);
            }
        }
    }, [items, isInitialized]);

    const addItem = useCallback((product: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
        setItems(currentItems => {
            const existingIndex = currentItems.findIndex(item => item.id === product.id);

            if (existingIndex > -1) {
                // Update existing item quantity
                const updatedItems = [...currentItems];
                const newQuantity = updatedItems[existingIndex].quantity + quantity;
                updatedItems[existingIndex] = {
                    ...updatedItems[existingIndex],
                    quantity: newQuantity
                };
                return updatedItems;
            } else {
                // Add new item
                return [...currentItems, { ...product, quantity }];
            }
        });
    }, []);

    const removeItem = useCallback((productId: string | number) => {
        setItems(currentItems => currentItems.filter(item => item.id !== productId));
    }, []);

    const updateQuantity = useCallback((productId: string | number, quantity: number) => {
        if (quantity < 1) {
            removeItem(productId);
            return;
        }

        setItems(currentItems =>
            currentItems.map(item =>
                item.id === productId
                    ? { ...item, quantity }
                    : item
            )
        );
    }, [removeItem]);

    const clearCart = useCallback(() => {
        setItems([]);
    }, []);

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{
            items,
            addItem,
            removeItem,
            updateQuantity,
            clearCart,
            totalItems,
            totalPrice
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
