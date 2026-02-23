import { createContext, useContext, useState, ReactNode } from "react";

type User = {
  id: number
  username: string
  name: string
  email: string
  image?: string | null
  plan?: string
};

type UserContextType = {
  user: User | null;
  isFirstLogin: boolean;
  setUser: (u: User) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used inside UserProvider");
  return context;
};
