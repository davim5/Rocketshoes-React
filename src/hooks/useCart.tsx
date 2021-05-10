import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { ThemeContext } from 'styled-components';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    // Busca o que tiver no localStorage
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    // Verifica se tem algo no localStorage, se tiver adiciona no cart
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    // Se não, passa array vazio
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const newCart = [...cart];

      const productExists = newCart.find(product => product.id === productId );
      
      const stock = await api.get(`/stock/${productId}`);
      const stockAmount = stock.data.amount;
      
      const currentAmount = productExists ? productExists.amount : 0;
      const amount = currentAmount + 1;

      if(amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      } 
      
      if(productExists) {
        productExists.amount = amount;
      } else {
        const product = await api.get(`/products/${productId}`)

        const newProduct = {
          ...product.data,
          amount: 1
        }
        newCart.push(newProduct);
      }

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      } catch {
      toast.error('Erro na adição do produto');
      }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = [...cart];

      const productIndex = newCart.findIndex(product => product.id === productId );

      if(productIndex >= 0){
        newCart.splice(productIndex,1)
        
      } else {
        toast.error('Erro na remoção do produto');
        return; 
      }

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const newCart = [...cart];

      const productExists = newCart.find(product => product.id === productId );
      // const productIndex = newCart.findIndex(product => product.id === productId )

      const stock = await api.get(`/stock/${productId}`);
      const stockAmount = stock.data.amount;
      
      if(productExists){
        // const newAmount = productExists.amount + amount;
        if(amount < 1)
        {
          toast.error('Quantidade do produto não pode ser menor que 1');
          return;
        }
        else if(amount > stockAmount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        // newCart.splice(productIndex,1)

        // const productUpdated = {
        //   ...productExists,
        //   amount
        // }
          
        // newCart.push(productUpdated);
  
        productExists.amount = amount;

        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))

      } else {
        toast.error('Erro na alteração de quantidade do produto');
        return;
      }
    } catch {    
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
