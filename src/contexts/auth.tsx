import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/api";

type User = {
  id: string;
  name: string;
  login: string;
  avatar_url: string;
}

type AuthResponse = {
  token: string;
  user: User;
}

type AuthContextData = {
  user: User | null; // Pode ser que não tenha logado ainda, então é nulo
  signInUrl: string;
  signOut: () => void;
}

type AuthProvider = {
  children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextData); // Forma para criar contextos

//Utilizado para dar acesso ao contexto para todos usuários
export function AuthProvider(props: AuthProvider) {
  const [user, setUser] = useState<User | null>(null)

  const signInUrl = `https://github.com/login/oauth/authorize?scope=user&client_id=829cdcef07de3011f9fc`;

  function signOut() {
    setUser(null);
    localStorage.removeItem('@dowhile:token')
  }

  //Função assincrona para chamar a api
  async function signIn(githubcode: string) {
    const response = await api.post<AuthResponse>('authenticate', {
      code: githubcode,
    })

    const { token, user } = response.data;

    // Armazenando token dentro do storage do navegador
    localStorage.setItem('@dowhile:token', token);

    api.defaults.headers.common.authorization = `Bearer ${token}`;

    setUser(user);
  }

  //Pegando o token salvo no localStorage
  useEffect(() => {
    const token = localStorage.getItem('@dowhile:token')

    if (token) {
      // o Axios faz com que toda requisição enviada dessa linha para frente acompanhe o token no header
      api.defaults.headers.common.authorization = `Bearer ${token}`;

      api.get<User>('profile').then(response => {
        setUser(response.data);
      })
    }
  }, [])

  useEffect(() => {
    // Pega a URL de retorno
    const url = window.location.href;

    //Verifica se a URL possui o código de retorno do github
    const hasGithubCode = url.includes('?code=');

    if (hasGithubCode) {
      // Quebra a URL em duas partes
      const [urlWithoutCode, githubCode] = url.split('?code=');

      // Força a URL de navegação do usuário
      window.history.pushState({}, '', urlWithoutCode);

      signIn(githubCode);
    }
  }, [])

  return (
    // Quando usamos duas chaves é para definir que é um objeto
    <AuthContext.Provider value={{ signInUrl, user, signOut }}>
      {props.children}
    </AuthContext.Provider>
  );
}