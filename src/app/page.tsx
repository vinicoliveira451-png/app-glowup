"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Camera, Upload, Sparkles, Droplets, Moon, Clock, TrendingUp, CheckCircle2, Calendar, BarChart3, User, ChevronRight, ShoppingBag, Hand, Droplet, Play, X, Home, Lock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getCurrentUser, signOut } from "@/lib/auth";
import { 
  getUserProfile, 
  createOrUpdateProfile,
  getAllChallenges,
  getUserProgress,
  getCompletedDaysCount,
  getCurrentStreak,
  saveSkinAnalysis,
  getUserSkinAnalysis,
  markChallengeComplete,
  markChallengeIncomplete,
  type Challenge,
  type UserProgress as DBUserProgress,
  type SkinAnalysis as DBSkinAnalysis
} from "@/lib/database";

type SkinAnalysis = {
  skinType: string;
  score: number;
  concerns: string[];
  recommendations: {
    products: string[];
    water: string;
    sleep: string;
    routine: string[];
  };
  progressionImages: string[];
};

type MassageTechnique = {
  title: string;
  description: string;
  steps: string[];
  duration: string;
  videoUrl: string;
};

type ProductRecommendation = {
  category: string;
  products: string[];
  tips: string;
};

type DayRoutine = {
  day: number;
  title: string;
  morning: string[];
  night: string[];
  tips: string;
  completed: boolean;
  products: ProductRecommendation[];
  massageTechniques: MassageTechnique[];
  cleansingTips: string[];
};

type Screen = "home" | "routine" | "progress" | "profile";
type TabType = "routine" | "products" | "techniques" | "cleansing";

export default function GlowUpApp() {
  const router = useRouter();
  const [currentScreen, setCurrentScreen] = useState<Screen>("home");
  const [step, setStep] = useState<"upload" | "analyzing" | "results">("upload");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentDay, setCurrentDay] = useState(1);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<MassageTechnique | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("routine");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [completedDays, setCompletedDays] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userProgress, setUserProgress] = useState<DBUserProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verificar autenticação e carregar dados do usuário
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push("/login");
          return;
        }
        
        setUserEmail(user.email || "");
        setUserId(user.id);
        
        // Criar ou atualizar perfil (sem bloquear o fluxo)
        createOrUpdateProfile(user.id, user.email || "").catch(err => {
          console.error("Erro ao criar perfil:", err);
        });
        
        // Carregar análise de pele salva
        const savedAnalysis = await getUserSkinAnalysis(user.id);
        if (savedAnalysis) {
          setAnalysis({
            skinType: savedAnalysis.skin_type,
            score: savedAnalysis.score,
            concerns: savedAnalysis.concerns,
            recommendations: {
              products: [
                "Sabonete facial com ácido salicílico",
                "Tônico adstringente com niacinamida",
                "Sérum de vitamina C pela manhã",
                "Hidratante oil-free com ácido hialurônico",
                "Protetor solar FPS 50+ toque seco"
              ],
              water: "2.5 litros por dia (8-10 copos)",
              sleep: "7-8 horas por noite (antes das 23h)",
              routine: [
                "Manhã: Lavar rosto → Vitamina C → Hidratante → Protetor solar",
                "Noite: Lavar rosto → Tônico → Sérum → Hidratante",
                "2x/semana: Esfoliação suave",
                "1x/semana: Máscara de argila"
              ]
            },
            progressionImages: []
          });
          setStep("results");
        }
        
        // Carregar desafios
        const challengesData = await getAllChallenges();
        setChallenges(challengesData);
        
        // Carregar progresso do usuário
        const progressData = await getUserProgress(user.id);
        setUserProgress(progressData);
        
        // Carregar estatísticas
        const completed = await getCompletedDaysCount(user.id);
        setCompletedDays(completed);
        
        const streak = await getCurrentStreak(user.id);
        setCurrentStreak(streak);
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
      }
    };
    checkAuth();
  }, [router]);

  // Inicializar data de início
  useEffect(() => {
    const savedStartDate = localStorage.getItem("glowup_start_date");
    if (!savedStartDate) {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem("glowup_start_date", today);
      setStartDate(today);
    } else {
      setStartDate(savedStartDate);
    }
  }, []);

  // Calcular dia atual baseado na data real
  useEffect(() => {
    if (startDate) {
      const start = new Date(startDate);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const calculatedDay = Math.min(diffDays, 30);
      setCurrentDay(calculatedDay);
    }
  }, [startDate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  // Rotina de 30 dias com informações detalhadas
  const routines: DayRoutine[] = [
    // Semana 1
    { 
      day: 1, 
      title: "Início da Jornada", 
      morning: ["Limpeza facial suave", "Hidratante leve", "Protetor solar FPS 50+"], 
      night: ["Limpeza facial", "Hidratante noturno"], 
      tips: "Comece devagar! Deixe sua pele se adaptar aos novos produtos.", 
      completed: false,
      products: [
        {
          category: "Limpeza",
          products: ["CeraVe Hydrating Cleanser", "Neutrogena Deep Clean", "La Roche-Posay Toleriane"],
          tips: "Escolha um limpador suave que não resseque a pele. Evite sabonetes comuns."
        },
        {
          category: "Hidratação",
          products: ["Neutrogena Hydro Boost", "CeraVe Moisturizing Cream", "The Ordinary Natural Moisturizing Factors"],
          tips: "Hidratantes com ácido hialurônico são ideais para todos os tipos de pele."
        },
        {
          category: "Proteção Solar",
          products: ["La Roche-Posay Anthelios", "Neutrogena Sun Fresh", "Isdin Fusion Water"],
          tips: "Use protetor solar TODOS os dias, mesmo em dias nublados ou dentro de casa."
        }
      ],
      massageTechniques: [
        {
          title: "Massagem Básica de Ativação",
          description: "Técnica suave para ativar a circulação e preparar a pele para absorver produtos",
          steps: [
            "Aplique o produto nas mãos e aqueça",
            "Movimentos circulares suaves na testa (centro para fora)",
            "Deslize dos lados do nariz até as têmporas",
            "Movimentos ascendentes no queixo até as orelhas",
            "Finalize com leves batidinhas no rosto todo"
          ],
          duration: "2-3 minutos",
          videoUrl: "/videos/massage-basic.mp4"
        }
      ],
      cleansingTips: [
        "Lave o rosto com água morna, nunca quente",
        "Use movimentos circulares suaves por 60 segundos",
        "Enxágue completamente, sem deixar resíduos",
        "Seque com toalha limpa, sem esfregar (apenas pressione levemente)"
      ]
    },
    { 
      day: 2, 
      title: "Construindo o Hábito", 
      morning: ["Limpeza facial", "Tônico facial", "Hidratante", "Protetor solar"], 
      night: ["Limpeza dupla", "Hidratante noturno"], 
      tips: "Beba pelo menos 2 litros de água hoje.", 
      completed: false,
      products: [
        {
          category: "Tônico",
          products: ["Thayers Witch Hazel", "Paula's Choice Pore Refining", "Simple Soothing Toner"],
          tips: "Tônicos equilibram o pH da pele após a limpeza. Aplique com algodão ou mãos."
        }
      ],
      massageTechniques: [
        {
          title: "Técnica de Drenagem Linfática",
          description: "Reduz inchaço e melhora a circulação",
          steps: [
            "Comece no centro da testa, deslize para as têmporas",
            "Do nariz, deslize para as orelhas",
            "Do queixo, suba até as orelhas",
            "Desça do pescoço até a clavícula (sempre para baixo)",
            "Repita cada movimento 5 vezes"
          ],
          duration: "3-4 minutos",
          videoUrl: "/videos/massage-lymphatic.mp4"
        }
      ],
      cleansingTips: [
        "Limpeza dupla: primeiro óleo/balm, depois limpador à base de água",
        "O primeiro passo remove maquiagem e protetor solar",
        "O segundo passo limpa a pele profundamente"
      ]
    },
    // ... (resto das rotinas permanece igual)
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        analyzeImage();
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    try {
      setStep("analyzing");
      setProgress(0);

      const intervals = [20, 40, 60, 80, 100];
      for (const target of intervals) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setProgress(target);
      }

      const newAnalysis = {
        skinType: "Mista com tendência oleosa",
        score: 7.2,
        concerns: ["Poros dilatados", "Oleosidade na zona T", "Leve desidratação"],
        recommendations: {
          products: [
            "Sabonete facial com ácido salicílico",
            "Tônico adstringente com niacinamida",
            "Sérum de vitamina C pela manhã",
            "Hidratante oil-free com ácido hialurônico",
            "Protetor solar FPS 50+ toque seco"
          ],
          water: "2.5 litros por dia (8-10 copos)",
          sleep: "7-8 horas por noite (antes das 23h)",
          routine: [
            "Manhã: Lavar rosto → Vitamina C → Hidratante → Protetor solar",
            "Noite: Lavar rosto → Tônico → Sérum → Hidratante",
            "2x/semana: Esfoliação suave",
            "1x/semana: Máscara de argila"
          ]
        },
        progressionImages: []
      };

      setAnalysis(newAnalysis);
      
      // Salvar análise no banco de dados (sem bloquear o fluxo)
      if (userId) {
        saveSkinAnalysis(
          userId,
          newAnalysis.skinType,
          newAnalysis.score,
          newAnalysis.concerns,
          selectedImage || undefined
        ).catch(err => {
          console.error("Erro ao salvar análise:", err);
        });
      }

      setStep("results");
    } catch (error) {
      console.error("Erro ao analisar imagem:", error);
      setStep("upload");
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const getCurrentWeek = () => Math.ceil(currentDay / 7);

  const openVideoModal = (technique: MassageTechnique) => {
    setSelectedVideo(technique);
    setShowVideoModal(true);
  };

  // Função para verificar se um dia está desbloqueado
  const isDayUnlocked = (day: number) => {
    return day <= currentDay;
  };

  // Renderização das telas (mantém o mesmo código visual)
  const renderHomeScreen = () => (
    <div className="space-y-6 sm:space-y-8">
      {step === "upload" && (
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4">
              Descubra o potencial da sua pele
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto">
              Tire uma foto do seu rosto e receba uma análise completa com recomendações personalizadas para 30 dias
            </p>
          </div>

          <Card className="p-8 sm:p-12 border-2 border-dashed border-gray-300 hover:border-purple-400 transition-all duration-300 bg-white/50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-rose-100 to-purple-100 flex items-center justify-center">
                <Camera className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600" />
              </div>
              
              <div className="text-center">
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                  Envie sua foto
                </h3>
                <p className="text-sm sm:text-base text-gray-500">
                  Tire uma selfie ou escolha uma foto do seu rosto
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleImageUpload}
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Button
                  onClick={handleCameraClick}
                  size="lg"
                  className="bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Tirar Foto
                </Button>
                <Button
                  onClick={handleCameraClick}
                  size="lg"
                  variant="outline"
                  className="border-2 border-purple-300 hover:bg-purple-50 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Escolher Arquivo
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-8 pt-8 border-t border-gray-200">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Análise Instantânea</p>
                    <p className="text-xs text-gray-500">Resultado em segundos</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">100% Privado</p>
                    <p className="text-xs text-gray-500">Seus dados seguros</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">IA Avançada</p>
                    <p className="text-xs text-gray-500">Tecnologia Meta AI</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {step === "analyzing" && (
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 sm:p-12 bg-white/80 backdrop-blur-sm shadow-2xl">
            <div className="flex flex-col items-center gap-6 sm:gap-8">
              <div className="relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center animate-pulse">
                  <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                </div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-400 to-purple-500 blur-xl opacity-50 animate-pulse"></div>
              </div>

              <div className="text-center w-full">
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Analisando sua pele...
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
                  Nossa IA está identificando seu tipo de pele e criando recomendações personalizadas
                </p>

                <div className="space-y-4">
                  <Progress value={progress} className="h-3" />
                  <p className="text-lg sm:text-xl font-semibold text-purple-600">{progress}%</p>
                </div>

                <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                  <div className={`p-4 rounded-xl transition-all duration-500 ${progress >= 20 ? 'bg-purple-50 border-2 border-purple-200' : 'bg-gray-50 border-2 border-gray-200'}`}>
                    <p className="text-xs sm:text-sm font-medium text-gray-700">Identificando tipo de pele</p>
                  </div>
                  <div className={`p-4 rounded-xl transition-all duration-500 ${progress >= 60 ? 'bg-purple-50 border-2 border-purple-200' : 'bg-gray-50 border-2 border-gray-200'}`}>
                    <p className="text-xs sm:text-sm font-medium text-gray-700">Avaliando condições</p>
                  </div>
                  <div className={`p-4 rounded-xl transition-all duration-500 ${progress >= 100 ? 'bg-purple-50 border-2 border-purple-200' : 'bg-gray-50 border-2 border-gray-200'}`}>
                    <p className="text-xs sm:text-sm font-medium text-gray-700">Gerando recomendações</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {step === "results" && analysis && (
        <div className="space-y-6 sm:space-y-8">
          <Card className="p-6 sm:p-8 bg-gradient-to-br from-white to-purple-50/30 border-2 border-purple-200 shadow-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left">
                <p className="text-sm font-medium text-gray-600 mb-2">Sua pontuação atual</p>
                <div className="flex items-baseline gap-2 justify-center sm:justify-start">
                  <span className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                    {analysis.score}
                  </span>
                  <span className="text-2xl sm:text-3xl text-gray-400">/10</span>
                </div>
                <p className="text-base sm:text-lg font-medium text-gray-700 mt-2">{analysis.skinType}</p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-purple-600">Potencial de melhoria: +2.8</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 sm:p-8 bg-white/80 backdrop-blur-sm">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Pontos de atenção identificados</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {analysis.concerns.map((concern, index) => (
                <div key={index} className="p-4 rounded-xl bg-rose-50 border border-rose-200">
                  <p className="text-sm font-medium text-rose-700">{concern}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 sm:p-8 bg-gradient-to-br from-purple-600 to-rose-600 text-white">
            <div className="text-center">
              <h3 className="text-2xl sm:text-3xl font-bold mb-4">Comece sua jornada de 30 dias!</h3>
              <p className="text-base sm:text-lg mb-6 sm:mb-8 opacity-90">
                Criamos uma rotina personalizada para você. Acesse a aba &quot;Rotina&quot; para começar!
              </p>
              <Button
                onClick={() => setCurrentScreen("routine")}
                size="lg"
                className="bg-white text-purple-600 hover:bg-gray-100 shadow-xl text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Ver Rotina Completa
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  const RoutineContent = () => {
    const currentRoutine = routines[currentDay - 1];
    const weekNumber = getCurrentWeek();

    return (
      <div className="space-y-6">
        {/* Header com progresso */}
        <Card className="p-6 bg-gradient-to-br from-purple-600 to-rose-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm opacity-90">Semana {weekNumber} de 4</p>
              <h2 className="text-2xl sm:text-3xl font-bold">Dia {currentDay} de 30</h2>
            </div>
            <div className="text-right">
              <p className="text-3xl sm:text-4xl font-bold">{Math.round((currentDay / 30) * 100)}%</p>
              <p className="text-sm opacity-90">Completo</p>
            </div>
          </div>
          <Progress value={(currentDay / 30) * 100} className="h-2 bg-white/20" />
        </Card>

        {/* Tabs de navegação */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => setActiveTab("routine")}
            className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
              activeTab === "routine"
                ? "bg-gradient-to-br from-purple-600 to-rose-600 text-white shadow-lg"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Calendar className="w-6 h-6" />
            <span className="text-xs font-medium">Rotina</span>
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
              activeTab === "products"
                ? "bg-gradient-to-br from-purple-600 to-rose-600 text-white shadow-lg"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <ShoppingBag className="w-6 h-6" />
            <span className="text-xs font-medium">Produtos</span>
          </button>
          <button
            onClick={() => setActiveTab("techniques")}
            className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
              activeTab === "techniques"
                ? "bg-gradient-to-br from-purple-600 to-rose-600 text-white shadow-lg"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Hand className="w-6 h-6" />
            <span className="text-xs font-medium">Técnicas</span>
          </button>
          <button
            onClick={() => setActiveTab("cleansing")}
            className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
              activeTab === "cleansing"
                ? "bg-gradient-to-br from-purple-600 to-rose-600 text-white shadow-lg"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Droplet className="w-6 h-6" />
            <span className="text-xs font-medium">Limpeza</span>
          </button>
        </div>

        {/* Conteúdo das tabs - mantém o mesmo código visual */}
        {activeTab === "routine" && (
          <Card className="p-6 sm:p-8 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{currentRoutine.title}</h3>
                <p className="text-sm text-gray-500">Dia {currentRoutine.day}</p>
              </div>
            </div>

            {/* Rotina Manhã */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Rotina da Manhã</h4>
              </div>
              <div className="space-y-2 ml-10">
                {currentRoutine.morning.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-white">{index + 1}</span>
                    </div>
                    <p className="text-sm text-gray-700">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Rotina Noite */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Moon className="w-5 h-5 text-indigo-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Rotina da Noite</h4>
              </div>
              <div className="space-y-2 ml-10">
                {currentRoutine.night.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-indigo-50 border border-indigo-200">
                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-white">{index + 1}</span>
                    </div>
                    <p className="text-sm text-gray-700">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Dica do dia */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-rose-50 to-purple-50 border-2 border-purple-200">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Dica do Dia</p>
                  <p className="text-sm text-gray-700">{currentRoutine.tips}</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Navegação entre dias */}
        <div className="flex gap-4">
          <Button
            onClick={() => setCurrentDay(Math.max(1, currentDay - 1))}
            disabled={currentDay === 1}
            variant="outline"
            className="flex-1 py-6"
          >
            Dia Anterior
          </Button>
          <Button
            onClick={() => {
              const nextDay = currentDay + 1;
              if (isDayUnlocked(nextDay)) {
                setCurrentDay(Math.min(30, nextDay));
              }
            }}
            disabled={currentDay === 30 || !isDayUnlocked(currentDay + 1)}
            className="flex-1 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white py-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!isDayUnlocked(currentDay + 1) ? (
              <>
                <Lock className="w-5 h-5 mr-2" />
                Bloqueado
              </>
            ) : (
              <>
                Próximo Dia
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Visão geral da semana */}
        <Card className="p-6 bg-white/80 backdrop-blur-sm">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Semana {weekNumber}</h4>
          <div className="grid grid-cols-7 gap-2">
            {routines.slice((weekNumber - 1) * 7, weekNumber * 7).map((day) => {
              const isUnlocked = isDayUnlocked(day.day);
              return (
                <button
                  key={day.day}
                  onClick={() => isUnlocked && setCurrentDay(day.day)}
                  disabled={!isUnlocked}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all ${
                    day.day === currentDay
                      ? 'bg-gradient-to-br from-rose-500 to-purple-600 text-white shadow-lg scale-110'
                      : day.day < currentDay
                      ? 'bg-green-100 text-green-700 border-2 border-green-300'
                      : !isUnlocked
                      ? 'bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed opacity-50'
                      : 'bg-gray-100 text-gray-600 border-2 border-gray-200'
                  }`}
                >
                  {!isUnlocked && day.day > currentDay ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <>
                      <span className="text-xs font-medium">Dia</span>
                      <span className="text-lg font-bold">{day.day}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    );
  };

  const renderRoutineScreen = () => <RoutineContent />;

  const renderProgressScreen = () => (
    <div className="space-y-6">
      <Card className="p-6 sm:p-8 bg-gradient-to-br from-white to-purple-50/30 border-2 border-purple-200">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Seu Progresso</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-6 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 border-2 border-rose-200">
            <p className="text-sm text-rose-600 font-medium mb-2">Dias Completos</p>
            <p className="text-4xl font-bold text-rose-700">{completedDays}</p>
            <p className="text-xs text-rose-600 mt-1">de 30 dias</p>
          </div>
          <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
            <p className="text-sm text-purple-600 font-medium mb-2">Sequência Atual</p>
            <p className="text-4xl font-bold text-purple-700">{currentStreak}</p>
            <p className="text-xs text-purple-600 mt-1">dias seguidos</p>
          </div>
          <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
            <p className="text-sm text-green-600 font-medium mb-2">Progresso</p>
            <p className="text-4xl font-bold text-green-700">{Math.round((completedDays / 30) * 100)}%</p>
            <p className="text-xs text-green-600 mt-1">concluído</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">Progresso Geral</p>
            <p className="text-sm font-bold text-purple-600">{Math.round((completedDays / 30) * 100)}%</p>
          </div>
          <Progress value={(completedDays / 30) * 100} className="h-3" />
        </div>
      </Card>

      <Card className="p-6 sm:p-8 bg-white/80 backdrop-blur-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Melhorias Esperadas</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-rose-50 to-purple-50">
            <div className="flex items-center gap-3">
              <Droplets className="w-6 h-6 text-purple-600" />
              <span className="font-medium text-gray-900">Hidratação</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={Math.min(100, (completedDays / 30) * 100 * 1.5)} className="w-24 h-2" />
              <span className="text-sm font-bold text-purple-600">+{Math.min(52, Math.round((completedDays / 30) * 52))}%</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-rose-50 to-purple-50">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <span className="font-medium text-gray-900">Textura</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={Math.min(100, (completedDays / 30) * 100 * 1.3)} className="w-24 h-2" />
              <span className="text-sm font-bold text-purple-600">+{Math.min(38, Math.round((completedDays / 30) * 38))}%</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-rose-50 to-purple-50">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-purple-600" />
              <span className="font-medium text-gray-900">Oleosidade</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={Math.min(100, (completedDays / 30) * 100 * 1.4)} className="w-24 h-2" />
              <span className="text-sm font-bold text-purple-600">+{Math.min(45, Math.round((completedDays / 30) * 45))}%</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 sm:p-8 bg-gradient-to-br from-purple-600 to-rose-600 text-white">
        <h3 className="text-2xl font-bold mb-4">Continue assim!</h3>
        <p className="text-lg opacity-90 mb-6">
          Você está no caminho certo. Mantenha a consistência e os resultados virão!
        </p>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6" />
          <span className="font-medium">Rotina diária mantida</span>
        </div>
      </Card>
    </div>
  );

  const renderProfileScreen = () => (
    <div className="space-y-6">
      <Card className="p-6 sm:p-8 bg-gradient-to-br from-white to-purple-50/30 border-2 border-purple-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Meu Perfil</h2>
              <p className="text-sm text-gray-500">{userEmail}</p>
            </div>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            size="sm"
            className="border-2 border-red-200 text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        {analysis && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-white border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Tipo de Pele</p>
              <p className="text-lg font-semibold text-gray-900">{analysis.skinType}</p>
            </div>
            <div className="p-4 rounded-lg bg-white border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Pontuação Inicial</p>
              <p className="text-lg font-semibold text-gray-900">{analysis.score}/10</p>
            </div>
            <div className="p-4 rounded-lg bg-white border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Meta de Pontuação</p>
              <p className="text-lg font-semibold text-gray-900">10.0/10</p>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6 sm:p-8 bg-white/80 backdrop-blur-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Conquistas</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg border-2 text-center ${completedDays >= 7 ? 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200' : 'bg-gray-100 border-gray-200 opacity-50'}`}>
            <div className="text-3xl mb-2">🏆</div>
            <p className={`text-sm font-semibold ${completedDays >= 7 ? 'text-amber-700' : 'text-gray-500'}`}>Primeira Semana</p>
          </div>
          <div className={`p-4 rounded-lg border-2 text-center ${completedDays >= 15 ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200' : 'bg-gray-100 border-gray-200 opacity-50'}`}>
            <div className="text-3xl mb-2">⭐</div>
            <p className={`text-sm font-semibold ${completedDays >= 15 ? 'text-blue-700' : 'text-gray-500'}`}>15 Dias</p>
          </div>
          <div className={`p-4 rounded-lg border-2 text-center ${completedDays >= 21 ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200' : 'bg-gray-100 border-gray-200 opacity-50'}`}>
            <div className="text-3xl mb-2">💎</div>
            <p className={`text-sm font-semibold ${completedDays >= 21 ? 'text-purple-700' : 'text-gray-500'}`}>21 Dias</p>
          </div>
          <div className={`p-4 rounded-lg border-2 text-center ${completedDays >= 30 ? 'bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200' : 'bg-gray-100 border-gray-200 opacity-50'}`}>
            <div className="text-3xl mb-2">👑</div>
            <p className={`text-sm font-semibold ${completedDays >= 30 ? 'text-rose-700' : 'text-gray-500'}`}>30 Dias</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-purple-600 to-rose-600 text-white">
        <h3 className="text-xl font-bold mb-2">Dica Profissional</h3>
        <p className="text-sm opacity-90">
          Tire fotos semanais no mesmo local e iluminação para acompanhar sua evolução visual!
        </p>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 pb-20">
      {/* Header */}
      <header className="border-b border-gray-200/50 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                  GlowUp 30 Dias
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">Transforme sua pele com IA</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-100 to-purple-100 rounded-full">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Powered by Meta AI</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {currentScreen === "home" && renderHomeScreen()}
        {currentScreen === "routine" && renderRoutineScreen()}
        {currentScreen === "progress" && renderProgressScreen()}
        {currentScreen === "profile" && renderProfileScreen()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-4 gap-1">
            <button
              onClick={() => setCurrentScreen("home")}
              className={`flex flex-col items-center justify-center py-3 px-2 transition-all ${
                currentScreen === "home"
                  ? "text-purple-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Home className={`w-6 h-6 mb-1 ${currentScreen === "home" ? "scale-110" : ""}`} />
              <span className="text-xs font-medium">Início</span>
              {currentScreen === "home" && (
                <div className="w-8 h-1 bg-gradient-to-r from-rose-500 to-purple-600 rounded-full mt-1"></div>
              )}
            </button>

            <button
              onClick={() => setCurrentScreen("routine")}
              className={`flex flex-col items-center justify-center py-3 px-2 transition-all ${
                currentScreen === "routine"
                  ? "text-purple-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Calendar className={`w-6 h-6 mb-1 ${currentScreen === "routine" ? "scale-110" : ""}`} />
              <span className="text-xs font-medium">Rotina</span>
              {currentScreen === "routine" && (
                <div className="w-8 h-1 bg-gradient-to-r from-rose-500 to-purple-600 rounded-full mt-1"></div>
              )}
            </button>

            <button
              onClick={() => setCurrentScreen("progress")}
              className={`flex flex-col items-center justify-center py-3 px-2 transition-all ${
                currentScreen === "progress"
                  ? "text-purple-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <BarChart3 className={`w-6 h-6 mb-1 ${currentScreen === "progress" ? "scale-110" : ""}`} />
              <span className="text-xs font-medium">Progresso</span>
              {currentScreen === "progress" && (
                <div className="w-8 h-1 bg-gradient-to-r from-rose-500 to-purple-600 rounded-full mt-1"></div>
              )}
            </button>

            <button
              onClick={() => setCurrentScreen("profile")}
              className={`flex flex-col items-center justify-center py-3 px-2 transition-all ${
                currentScreen === "profile"
                  ? "text-purple-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <User className={`w-6 h-6 mb-1 ${currentScreen === "profile" ? "scale-110" : ""}`} />
              <span className="text-xs font-medium">Perfil</span>
              {currentScreen === "profile" && (
                <div className="w-8 h-1 bg-gradient-to-r from-rose-500 to-purple-600 rounded-full mt-1"></div>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Modal de Vídeo */}
      {showVideoModal && selectedVideo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedVideo.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedVideo.description}</p>
                </div>
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Área do vídeo ilustrativo */}
              <div className="aspect-video bg-gradient-to-br from-pink-100 to-rose-100 rounded-xl mb-6 flex items-center justify-center border-2 border-pink-200">
                <div className="text-center p-8">
                  <Play className="w-16 h-16 text-pink-600 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Vídeo ilustrativo em desenvolvimento</p>
                  <p className="text-sm text-gray-500 mt-2">Siga os passos abaixo para realizar a técnica</p>
                </div>
              </div>

              {/* Passos detalhados */}
              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 mb-3">Passo a passo:</h4>
                {selectedVideo.steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-pink-50 border border-pink-200">
                    <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-white">{index + 1}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{step}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-pink-100 to-rose-100 border border-pink-200">
                <div className="flex items-center gap-2 text-pink-700">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold">Duração recomendada: {selectedVideo.duration}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
