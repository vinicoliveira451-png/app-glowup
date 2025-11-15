"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Mail, Lock, User, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          router.push("/");
        }
      } else {
        // Cadastro
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          // Criar perfil do usuário
          const { error: profileError } = await supabase
            .from("profiles")
            .insert([
              {
                id: data.user.id,
                name: name,
                email: email,
              },
            ]);

          if (profileError) console.error("Erro ao criar perfil:", profileError);

          router.push("/");
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro ao processar autenticação");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-white/80 backdrop-blur-sm shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center shadow-lg mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent mb-2">
            GlowUp 30 Dias
          </h1>
          <p className="text-gray-600">
            {isLogin ? "Entre na sua conta" : "Crie sua conta"}
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700 font-medium">
                Nome
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  className="pl-10 h-12 border-2 border-gray-200 focus:border-purple-400"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700 font-medium">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 h-12 border-2 border-gray-200 focus:border-purple-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700 font-medium">
              Senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="pl-10 h-12 border-2 border-gray-200 focus:border-purple-400"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white shadow-lg text-base font-semibold"
          >
            {loading ? (
              "Processando..."
            ) : isLogin ? (
              <>
                Entrar
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            ) : (
              <>
                Criar Conta
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </form>

        {/* Toggle Login/Cadastro */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-sm text-gray-600 hover:text-purple-600 transition-colors"
          >
            {isLogin ? (
              <>
                Não tem uma conta?{" "}
                <span className="font-semibold text-purple-600">
                  Cadastre-se
                </span>
              </>
            ) : (
              <>
                Já tem uma conta?{" "}
                <span className="font-semibold text-purple-600">Entre</span>
              </>
            )}
          </button>
        </div>

        {/* Informações */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>Seus dados estão seguros e criptografados</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
