import React, { createContext, useContext, useState, useEffect } from 'react';
import { Medicine } from '../types.ts';

export interface CartItem {
  medicine: Medicine;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  attachedPrescriptionId: string | null;
  setAttachedPrescriptionId: (id: string | null) => void;
  addToCart: (medicine: Medicine, quantity?: number) => void;
  updateQuantity: (medicineId: string, quantity: number) => void;
  removeFromCart: (medicineId: string) => void;
  clearCart: () => void;
  totalAmount: number;
  totalItemsCount: number;
  hasPrescriptionRequiredItems: boolean;
}

const CartContext = createContext<CartContextType>({
  items: [],
  attachedPrescriptionId: null,
  setAttachedPrescriptionId: () => {},
  addToCart: () => {},
  updateQuantity: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  totalAmount: 0,
  totalItemsCount: 0,
  hasPrescriptionRequiredItems: false,
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('uyirthunai_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [attachedPrescriptionId, setAttachedPrescriptionId] = useState<string | null>(() => {
    return localStorage.getItem('uyirthunai_attached_rx') || null;
  });

  useEffect(() => {
    localStorage.setItem('uyirthunai_cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (attachedPrescriptionId) {
      localStorage.setItem('uyirthunai_attached_rx', attachedPrescriptionId);
    } else {
      localStorage.removeItem('uyirthunai_attached_rx');
    }
  }, [attachedPrescriptionId]);

  const addToCart = (medicine: Medicine, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.medicine.id === medicine.id);
      if (existing) {
        const newQty = Math.min(medicine.stock_quantity, existing.quantity + quantity);
        return prev.map(i => (i.medicine.id === medicine.id ? { ...i, quantity: newQty } : i));
      }
      return [...prev, { medicine, quantity: Math.min(medicine.stock_quantity, quantity) }];
    });
  };

  const updateQuantity = (medicineId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(medicineId);
      return;
    }
    setItems(prev =>
      prev.map(i => {
        if (i.medicine.id === medicineId) {
          const validQty = Math.min(i.medicine.stock_quantity, quantity);
          return { ...i, quantity: validQty };
        }
        return i;
      })
    );
  };

  const removeFromCart = (medicineId: string) => {
    setItems(prev => prev.filter(i => i.medicine.id !== medicineId));
  };

  const clearCart = () => {
    setItems([]);
    setAttachedPrescriptionId(null);
  };

  const totalAmount = items.reduce((acc, curr) => acc + curr.medicine.price_inr * curr.quantity, 0);
  const totalItemsCount = items.reduce((acc, curr) => acc + curr.quantity, 0);
  const hasPrescriptionRequiredItems = items.some(i => i.medicine.prescription_required === 1);

  return (
    <CartContext.Provider
      value={{
        items,
        attachedPrescriptionId,
        setAttachedPrescriptionId,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalAmount,
        totalItemsCount,
        hasPrescriptionRequiredItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
