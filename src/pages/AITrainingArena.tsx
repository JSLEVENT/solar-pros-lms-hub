import { useState } from "react";
import { LMSLayout } from "@/components/LMSLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Zap, Target, Trophy, MessageSquare, BookOpen, Users, PlayCircle } from "lucide-react";

const AITrainingArena = () => {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [userMessage, setUserMessage] = useState("");
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string, message: string}>>([]);

  const scenarios = [
    {
      id: "objection-handling",
      title: "Objection Handling Master",
      description: "Practice handling common customer objections with AI-powered realistic scenarios",
      difficulty: "Intermediate",
      category: "Sales Skills",
      icon: Target,
      color: "bg-blue-500"
    },
    {
      id: "cold-calling",
      title: "Cold Calling Champion",
      description: "Master the art of cold calling with dynamic AI prospects",
      difficulty: "Advanced",
      category: "Prospecting",
      icon: MessageSquare,
      color: "bg-green-500"
    },
    {
      id: "product-demo",
      title: "Product Demo Pro",
      description: "Perfect your product demonstrations with interactive AI customers",
      difficulty: "Beginner",
      category: "Demos",
      icon: PlayCircle,
      color: "bg-purple-500"
    },
    {
      id: "negotiation",
      title: "Negotiation Ninja",
      description: "Sharpen your negotiation skills with challenging AI scenarios",
      difficulty: "Advanced",
      category: "Closing",
      icon: Trophy,
      color: "bg-orange-500"
    },
    {
      id: "discovery-calls",
      title: "Discovery Call Detective",
      description: "Learn to ask the right questions and uncover customer needs",
      difficulty: "Intermediate",
      category: "Discovery",
      icon: Brain,
      color: "bg-indigo-500"
    },
    {
      id: "follow-up",
      title: "Follow-up Specialist",
      description: "Master the timing and messaging of effective follow-ups",
      difficulty: "Beginner",
      category: "Follow-up",
      icon: Zap,
      color: "bg-red-500"
    }
  ];

  const leaderboard = [
    { name: "Sarah Chen", score: 2850, scenarios: 28, badge: "Master" },
    { name: "Mike Rodriguez", score: 2720, scenarios: 25, badge: "Expert" },
    { name: "Emma Davis", score: 2650, scenarios: 23, badge: "Expert" },
    { name: "You", score: 1890, scenarios: 15, badge: "Advanced" },
    { name: "Tom Wilson", score: 1750, scenarios: 12, badge: "Advanced" }
  ];

  const handleStartScenario = (scenarioId: string) => {
    setSelectedScenario(scenarioId);
    const scenario = scenarios.find(s => s.id === scenarioId);
    setConversationHistory([
      {
        role: "ai",
        message: `Welcome to ${scenario?.title}! I'll be playing the role of your prospect. Let's begin this ${scenario?.category} scenario. How would you like to start?`
      }
    ]);
  };

  const sendMessage = () => {
    if (!userMessage.trim()) return;
    
    setConversationHistory(prev => [
      ...prev,
      { role: "user", message: userMessage },
      { role: "ai", message: "That's an interesting approach. Let me respond as your prospect would..." }
    ]);
    setUserMessage("");
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "bg-green-100 text-green-800";
      case "Intermediate": return "bg-yellow-100 text-yellow-800";
      case "Advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <LMSLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Training Arena</h1>
          <p className="text-muted-foreground">
            Practice your sales skills with AI-powered scenarios and interactive simulations
          </p>
        </div>

        <Tabs defaultValue="scenarios" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="scenarios">Training Scenarios</TabsTrigger>
            <TabsTrigger value="active">Active Session</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="scenarios" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Scenarios Completed</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">15</div>
                  <p className="text-xs text-muted-foreground">+3 this week</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Score</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,890</div>
                  <p className="text-xs text-muted-foreground">Rank #4</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Skill Level</CardTitle>
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Advanced</div>
                  <p className="text-xs text-muted-foreground">Next: Master</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Practice Hours</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">24.5</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {scenarios.map((scenario) => {
                const IconComponent = scenario.icon;
                return (
                  <Card key={scenario.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-md ${scenario.color}`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <Badge className={getDifficultyColor(scenario.difficulty)}>
                          {scenario.difficulty}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl">{scenario.title}</CardTitle>
                      <CardDescription>{scenario.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Category:</span>
                          <Badge variant="outline">{scenario.category}</Badge>
                        </div>
                        <Button 
                          className="w-full" 
                          onClick={() => handleStartScenario(scenario.id)}
                        >
                          Start Training
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="active" className="space-y-6">
            {selectedScenario ? (
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <Card className="h-[600px] flex flex-col">
                    <CardHeader>
                      <CardTitle>Training Session</CardTitle>
                      <CardDescription>
                        {scenarios.find(s => s.id === selectedScenario)?.title}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <div className="flex-1 space-y-4 overflow-y-auto mb-4 p-4 bg-muted/50 rounded-lg">
                        {conversationHistory.map((message, index) => (
                          <div
                            key={index}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs p-3 rounded-lg ${
                                message.role === 'user'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-background border'
                              }`}
                            >
                              {message.message}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Type your response..."
                          value={userMessage}
                          onChange={(e) => setUserMessage(e.target.value)}
                          className="flex-1"
                          rows={3}
                        />
                        <Button onClick={sendMessage} className="self-end">
                          Send
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Session Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span>12:34</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Exchanges:</span>
                        <span>{conversationHistory.length / 2}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Current Score:</span>
                        <span>+85</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>AI Feedback</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Real-time feedback will appear here as you progress through the scenario.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-64">
                  <Brain className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Session</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Select a training scenario to start an AI-powered practice session
                  </p>
                  <Button onClick={() => window.location.reload()}>
                    Browse Scenarios
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Training Arena Leaderboard
                </CardTitle>
                <CardDescription>
                  Top performers this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leaderboard.map((user, index) => (
                    <div
                      key={user.name}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        user.name === "You" ? "bg-primary/5 border-primary" : ""
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                          <span className="text-sm font-bold">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {user.scenarios} scenarios completed
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{user.score.toLocaleString()}</p>
                        <Badge variant="outline">{user.badge}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </LMSLayout>
  );
};

export default AITrainingArena;