"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, Key, Trash2, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getApiKey,
  setApiKey,
  removeApiKey,
  getLlmProvider,
  setLlmProvider,
  getLlmModel,
  setLlmModel,
  getUseCustomModel,
  setUseCustomModel,
  LlmProvider,
  OPENROUTER_MODELS,
  OPENAI_MODELS,
} from "@/lib/local-storage";

export default function SettingsPage() {
  const router = useRouter();
  const [showKey, setShowKey] = useState(false);

  // Initialize state from localStorage on component mount (safe for SSR since localStorage is only accessed during render)
  const initialKey = getApiKey();
  const initialProvider = getLlmProvider();
  const initialModel = getLlmModel();
  const initialUseCustom = getUseCustomModel();

  const [activeTab, setActiveTab] = useState<LlmProvider>(initialProvider);
  const [hasKey, setHasKey] = useState(!!initialKey);
  const [apiKey, setApiKeyState] = useState(initialKey || "");
  const [useCustomModel, setUseCustomModelState] = useState(initialUseCustom);
  const [customModelName, setCustomModelName] = useState(
    initialUseCustom ? initialModel : ""
  );
  const [model, setModel] = useState(
    initialUseCustom
      ? initialModel
      : initialModel || (initialProvider === "openai" ? "gpt-4o-mini" : "openai/gpt-4o-mini")
  );

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast.error("APIキーを入力してください");
      return;
    }

    // カスタムモデルを使用する場合はカスタム名を保存
    const finalModel = useCustomModel 
      ? (customModelName.trim() || model)
      : model;

    if (!finalModel) {
      toast.error("モデルを選択または入力してください");
      return;
    }

    setApiKey(apiKey.trim());
    setLlmProvider(activeTab);
    setLlmModel(finalModel);
    setUseCustomModel(useCustomModel);
    setHasKey(true);
    toast.success("設定を保存しました");
  };

  const handleDelete = () => {
    removeApiKey();
    setHasKey(false);
    setApiKeyState("");
    toast.success("APIキーを削除しました");
  };

  const currentModels = activeTab === "openai" ? OPENAI_MODELS : OPENROUTER_MODELS;

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">設定</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              LLM API設定
            </CardTitle>
            <CardDescription>
              タスク解析に使用するLLMを選択してください。
              APIキーはブラウザのlocalStorageに保存されます。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs
              value={activeTab}
              onValueChange={(v) => {
                setActiveTab(v as LlmProvider);
                // モデルをデフォルトにリセット
                if (!useCustomModel) {
                  setModel(v === "openai" ? "gpt-4o-mini" : "openai/gpt-4o-mini");
                }
              }}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="openrouter">OpenRouter</TabsTrigger>
                <TabsTrigger value="openai">OpenAI</TabsTrigger>
              </TabsList>

              <TabsContent value="openrouter" className="space-y-4 mt-4">
                <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                  <p className="font-medium mb-1">OpenRouterとは？</p>
                  <p>
                    複数のLLM（GPT, Claude, Gemini等）を統合して使えるサービスです。
                    1つのAPIキーで様々なモデルを切り替えられます。
                  </p>
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-blue-600 hover:underline"
                  >
                    APIキーを取得 <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </TabsContent>

              <TabsContent value="openai" className="space-y-4 mt-4">
                <div className="bg-green-50 p-3 rounded-lg text-sm text-green-800">
                  <p className="font-medium mb-1">OpenAI</p>
                  <p>
                    OpenAIの公式APIを直接使用します。
                    GPT-4やGPT-4oシリーズが利用できます。
                  </p>
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-green-600 hover:underline"
                  >
                    APIキーを取得 <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">APIキー</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showKey ? "text" : "password"}
                    placeholder={activeTab === "openrouter" ? "sk-or-v1-..." : "sk-..."}
                    value={apiKey}
                    onChange={(e) => setApiKeyState(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* モデル選択エリア */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>モデル</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="useCustomModel"
                      checked={useCustomModel}
                      onCheckedChange={(checked) => {
                        setUseCustomModelState(checked as boolean);
                        if (checked) {
                          // カスタムモデルに切り替え時、現在のモデル名を初期値として設定
                          setCustomModelName(model);
                        }
                      }}
                    />
                    <label
                      htmlFor="useCustomModel"
                      className="text-sm text-gray-600 cursor-pointer"
                    >
                      カスタムモデル名を使用
                    </label>
                  </div>
                </div>
                
                {useCustomModel ? (
                  <Input
                    placeholder="モデル名を入力（例: anthropic/claude-3-opus）"
                    value={customModelName}
                    onChange={(e) => setCustomModelName(e.target.value)}
                  />
                ) : (
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="モデルを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentModels.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-gray-500">
                  プリセットから選択するか、カスタムモデル名を入力できます
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600"
                >
                  保存
                </Button>
                {hasKey && (
                  <Button variant="destructive" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>データ管理</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              タスクデータはクラウド（PostgreSQL）に保存されます。
              APIキーのみがローカルに保存されます。
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
