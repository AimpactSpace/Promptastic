import React, { useState, useEffect, useCallback } from 'react';

// Constants for item types
const ITEM_TYPES = {
  PROMPT: 'prompt',
  NOTE: 'note',
  TASK: 'task',
  HOME: 'home',
};

// Helper function for sorting items by creation date (newest first)
const sortByCreatedAt = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);

// --- AI Assistant & Gemini API Code ---
const GEMINI_API_KEY = ""; // Per instructions, leave empty.

// Schema for AI responses (Chat Assistant)
const geminiChatResponseSchema = {
  type: "OBJECT",
  properties: {
    "assistantAction": {
      "type": "STRING",
      "description": "The primary action the assistant has decided to take or the type of response it's giving.",
      "enum": ["CREATE_NEW_ITEM", "FIND_ITEMS", "GENERAL_RESPONSE", "CLARIFICATION_NEEDED", "UNSUPPORTED_ACTION"]
    },
    "itemType": {
      "type": "STRING",
      "description": "Relevant if creating or finding items (prompt, note, or task).",
      "enum": [ITEM_TYPES.PROMPT, ITEM_TYPES.NOTE, ITEM_TYPES.TASK, "N/A"]
    },
    "itemData": {
      "type": "OBJECT",
      "description": "Data for the new item to be created. For FIND_ITEMS, this can contain search criteria.",
      "properties": {
        "title": { "type": "STRING" },
        "description": { "type": "STRING", "description": "Used for prompts." },
        "content": { "type": "STRING", "description": "Used for notes." },
        "dueDate": { "type": "STRING", "description": "For tasks, in YYYY-MM-DD format." },
        "keywords": { "type": "STRING", "description": "Keywords to search for in title, description, or content." },
        "status": { "type": "STRING", "enum": ["pending", "completed", "all"], "description": "Task completion status to filter by."}
      }
    },
    "responseSummary": {
      "type": "STRING",
      "description": "The textual answer to the user's query, a summary of items found, a confirmation message about action taken, or an error message."
    },
    "clarificationQuestion": {
        "type": "STRING",
        "description": "A question to ask the user if more information is needed."
    }
  },
  "required": ["assistantAction", "responseSummary"]
};

// Theme Switcher Component
const ThemeSwitcher = ({ theme, toggleTheme }) => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);
  if (!isMounted) return null;
  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      className={`relative inline-flex items-center h-7 w-12 rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${theme === 'light' ? 'bg-slate-300 focus:ring-slate-400 focus:ring-offset-white' : 'bg-slate-700 focus:ring-purple-500 focus:ring-offset-slate-900'}`}
    >
      <span className={`inline-block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ease-in-out ${theme === 'light' ? 'translate-x-1' : 'translate-x-6'}`}>
        <span className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${theme === 'light' ? 'opacity-100' : 'opacity-0'}`}><SunIcon className="w-3 h-3 text-yellow-500" /></span>
        <span className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${theme === 'dark' ? 'opacity-100' : 'opacity-0'}`}><MoonIcon className="w-3 h-3 text-slate-300" /></span>
      </span>
    </button>
  );
};

// Main App Component
function App() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Mock Data
  const [prompts, setPrompts] = useState([
    { id: 'p1', title: 'Brainstorming Session Prep', description: 'Generate creative ideas for the new AI ethics course.', createdAt: new Date('2025-05-01T10:00:00Z') },
    { id: 'p2', title: 'AI Storytelling Angles', description: 'Craft compelling narratives for AI impact stories.', createdAt: new Date('2025-05-02T11:30:00Z') },
    { id: 'p3', title: 'Content Creation Strategy', description: 'Develop a strategy for Q3 content.', createdAt: new Date('2025-05-03T10:00:00Z') },
    { id: 'p4', title: 'User Persona Development', description: 'Define key user personas for the new app feature.', createdAt: new Date('2025-05-04T10:00:00Z') },
    { id: 'p5', title: 'Competitor Analysis Report', description: 'Summarize findings from recent competitor analysis.', createdAt: new Date('2025-05-05T10:00:00Z') },
    { id: 'p6', title: 'Marketing Campaign Ideas', description: 'Brainstorm innovative marketing campaign concepts.', createdAt: new Date('2025-05-06T10:00:00Z') },
  ]);
  const [notes, setNotes] = useState([
    { id: 'n1', title: 'Weekly Shopping List', content: 'Grocery list: Almond milk, organic eggs, whole wheat bread, fresh vegetables, quinoa.', createdAt: new Date('2025-05-04T09:00:00Z') },
    { id: 'n2', title: 'Aimpact Space Feature Ideas', content: 'Ideas for Aimpact Space: Advanced prompt library, collaborative project boards, AI tool integration API.', createdAt: new Date('2025-05-05T16:00:00Z') },
  ]);
  const [tasks, setTasks] = useState([
    { id: 't1', title: 'Develop AI Mentor Chatbot Wireframes', dueDate: new Date('2025-06-10T17:00:00Z'), completed: false, createdAt: new Date('2025-05-06T09:00:00Z') },
    { id: 't2', title: 'Review User Feedback on Aimpact Space', dueDate: new Date('2025-06-07T12:00:00Z'), completed: true, createdAt: new Date('2025-05-07T10:00:00Z') },
  ]);

  // UI states
  const [activeTab, setActiveTab] = useState(ITEM_TYPES.HOME);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddItemTypeModal, setShowAddItemTypeModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState('');
  const [itemToDelete, setItemToDelete] = useState(null);

  // AI Assistant State
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiChatHistory, setAIChatHistory] = useState([]);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false); 

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');

  // CRUD Functions
  const handleAddItem = useCallback(async (type, data, source = 'user') => {
    const newItem = { id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, ...data, createdAt: new Date() };
    if (type === ITEM_TYPES.PROMPT) setPrompts(prev => [...prev, newItem].sort(sortByCreatedAt));
    else if (type === ITEM_TYPES.NOTE) setNotes(prev => [...prev, newItem].sort(sortByCreatedAt));
    else if (type === ITEM_TYPES.TASK) setTasks(prev => [...prev, newItem].sort(sortByCreatedAt));
    if (source === 'user') closeModals();
    return newItem;
  }, []);

  const handleUpdateItem = useCallback(async (type, id, data) => {
    const updateList = (prevList) => prevList.map(item => item.id === id ? { ...item, ...data } : item).sort(sortByCreatedAt);
    if (type === ITEM_TYPES.PROMPT) setPrompts(updateList);
    else if (type === ITEM_TYPES.NOTE) setNotes(updateList);
    else if (type === ITEM_TYPES.TASK) setTasks(updateList);
    
    if (showDetailModal && selectedItem && selectedItem.id === id) {
        setSelectedItem(prev => ({...prev, ...data}));
    } else if (showDetailModal) { 
        closeModals();
    }
  }, [showDetailModal, selectedItem]); 

  const initiateDeleteItem = useCallback((type, id) => {
    setItemToDelete({ type, id }); setShowConfirmationModal(true); setShowDetailModal(false);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!itemToDelete) return;
    const { type, id } = itemToDelete;
    const filterList = (prevList) => prevList.filter(item => item.id !== id);
    if (type === ITEM_TYPES.PROMPT) setPrompts(filterList);
    else if (type === ITEM_TYPES.NOTE) setNotes(filterList);
    else if (type === ITEM_TYPES.TASK) setTasks(filterList);
    closeModals();
  }, [itemToDelete]);

  const openAddModal = (type) => { setModalType(type); setShowAddModal(true); setShowAddItemTypeModal(false); };
  const openDetailModal = (type, item) => { setModalType(type); setSelectedItem(item); setShowDetailModal(true); };
  const closeModals = () => { setShowAddModal(false); setShowDetailModal(false); setShowAddItemTypeModal(false); setShowConfirmationModal(false); setSelectedItem(null); setModalType(''); setItemToDelete(null); };
  
  // --- Gemini API Call Logic ---
  const callGeminiAPI = async (promptText, schema = null) => {
    const payload = {
      contents: [{ role: "user", parts: [{ text: promptText }] }],
      ...(schema && { 
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
        }
      })
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("API Error Body:", errorBody);
      throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
    }
    return response.json();
  };

  // AI Chat Interaction
  const handleAISubmit = async (userMessage) => {
    setIsAILoading(true);
    const currentChatHistory = [...aiChatHistory, { role: "user", parts: [{ text: userMessage }] }];
    setAIChatHistory(currentChatHistory);

    const systemPrompt = `You are a helpful AI assistant for the Productivity Hub application.
    Capabilities:
    1. Create new items (prompts, notes, tasks).
    2. Find items based on keywords or status (for tasks).
    3. General conversation.
    Respond using the provided JSON schema. Today's date is ${new Date().toLocaleDateString()}. User's request: ${userMessage}`;
    
    try {
      const result = await callGeminiAPI(systemPrompt, geminiChatResponseSchema);
      let aiResponseText = "Sorry, I couldn't process that.";
      let assistantProcessedInfo = { action: "Error", details: "Could not get a valid response." };

      if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts[0]) {
        const parsedJson = JSON.parse(result.candidates[0].content.parts[0].text);
        aiResponseText = parsedJson.responseSummary || "I've processed your request.";
        assistantProcessedInfo = { 
            action: parsedJson.assistantAction, 
            itemType: parsedJson.itemType,
            data: parsedJson.itemData,
            summary: parsedJson.responseSummary,
            clarification: parsedJson.clarificationQuestion
        };

        if (parsedJson.assistantAction === "CREATE_NEW_ITEM" && parsedJson.itemType && parsedJson.itemData) {
          const { title, description, content, dueDate } = parsedJson.itemData;
          let newItemData = { title };
          if (parsedJson.itemType === ITEM_TYPES.PROMPT) newItemData.description = description;
          else if (parsedJson.itemType === ITEM_TYPES.NOTE) newItemData.content = content;
          else if (parsedJson.itemType === ITEM_TYPES.TASK) {
            newItemData.completed = false;
            if (dueDate) newItemData.dueDate = new Date(dueDate);
          }
          const createdItem = await handleAddItem(parsedJson.itemType, newItemData, 'ai');
          aiResponseText = parsedJson.responseSummary || `Successfully created ${parsedJson.itemType}: ${createdItem.title}`;
          assistantProcessedInfo.details = `Created ${parsedJson.itemType}: '${createdItem.title}'.`;
        } else if (parsedJson.assistantAction === "FIND_ITEMS") {
            assistantProcessedInfo.details = `Looking for ${parsedJson.itemType || 'items'} matching: ${JSON.stringify(parsedJson.itemData || {})}.`;
        }
      } else { console.error("Unexpected Gemini response structure for AI Chat:", result); }
      
      setAIChatHistory(prev => [...prev, { role: "model", parts: [{ text: aiResponseText }], processed: assistantProcessedInfo }]);
    } catch (error) {
      console.error("Error in handleAISubmit:", error);
      setAIChatHistory(prev => [...prev, { role: "model", parts: [{ text: "I encountered an error. Please try again." }], processed: {action: "Error", details: error.message} }]);
    } finally {
      setIsAILoading(false);
    }
  };

  // AI Enhance Prompt Feature
  const handleEnhancePromptWithAI = async (promptToEnhance, currentDescription) => {
    if (!promptToEnhance || !promptToEnhance.id) {
        console.error("Invalid prompt object passed to enhancement function.");
        return;
    }
    setIsEnhancing(true);
    const systemPrompt = `Enhance the following prompt description to be more detailed, clear, and effective.
    Current prompt title: "${promptToEnhance.title}"
    Current description: "${currentDescription}"
    Desired output: Only the new, enhanced description text. Be creative and thorough.`;

    try {
        const result = await callGeminiAPI(systemPrompt); 
        if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts[0]) {
            const enhancedDescription = result.candidates[0].content.parts[0].text;
            if (selectedItem && selectedItem.id === promptToEnhance.id && modalType === ITEM_TYPES.PROMPT) {
                setSelectedItem(prev => ({ ...prev, description: enhancedDescription }));
            }
        } else {
            console.error("Unexpected Gemini response structure for prompt enhancement:", result);
            alert("Could not enhance the prompt. Please try again.");
        }
    } catch (error) {
        console.error("Error enhancing prompt:", error);
        alert(`Error enhancing prompt: ${error.message}`);
    } finally {
        setIsEnhancing(false);
    }
  };

  // THIS IS THE CORRECTED renderContent FUNCTION
  const renderContent = () => {
    switch (activeTab) {
      case ITEM_TYPES.HOME:
        return <HomeDashboard prompts={prompts} notes={notes} tasks={tasks} openDetailModal={openDetailModal} setActiveTab={setActiveTab} />;
      case ITEM_TYPES.PROMPT:
        return <ItemList type={ITEM_TYPES.PROMPT} items={prompts} openDetailModal={openDetailModal} onUpdateItem={handleUpdateItem} />;
      case ITEM_TYPES.NOTE:
        return <ItemList type={ITEM_TYPES.NOTE} items={notes} openDetailModal={openDetailModal} onUpdateItem={handleUpdateItem} />;
      case ITEM_TYPES.TASK:
        return <ItemList type={ITEM_TYPES.TASK} items={tasks} openDetailModal={openDetailModal} onUpdateItem={handleUpdateItem} />;
      default:
        return <HomeDashboard prompts={prompts} notes={notes} tasks={tasks} openDetailModal={openDetailModal} setActiveTab={setActiveTab} />;
    }
  };
  
  useEffect(() => { 
    const handleEsc = (event) => { if (event.key === 'Escape') closeModals(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <>
      <style>{`
        @keyframes modalEnter { 0% { transform: scale(0.95) translateY(10px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
        .animate-modalEnter { animation: modalEnter 0.25s ease-out forwards; }
        body, .themed-background, .themed-text, .themed-border, .themed-backdrop-blur { transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease; }
        .backdrop-blur-lg, .backdrop-blur-xl { transition: backdrop-filter 0.3s ease; }
      `}</style>
      <div className="relative flex size-full min-h-screen flex-col bg-slate-100 dark:bg-[#0D1117] justify-between group/design-root overflow-x-hidden themed-background" style={{ fontFamily: 'Inter, sans-serif' }}>
        <Header onOpenAddItemTypeModal={() => setShowAddItemTypeModal(true)} theme={theme} toggleTheme={toggleTheme} />
        <div className="flex-1 overflow-y-auto pb-24 pt-4 themed-background">
          {renderContent()} {/* This will now call the corrected function */}
        </div>
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

        {showAddItemTypeModal && <AddItemTypeSelectionModal isOpen={showAddItemTypeModal} onClose={closeModals} onSelectType={openAddModal} />}
        {showAddModal && <AddItemModal isOpen={showAddModal} onClose={closeModals} type={modalType} onSave={handleAddItem} />}
        {showDetailModal && selectedItem && 
            <DetailModal 
                isOpen={showDetailModal} 
                onClose={closeModals} 
                type={modalType} 
                item={selectedItem} 
                onUpdate={handleUpdateItem} 
                onDelete={initiateDeleteItem}
                onEnhancePrompt={handleEnhancePromptWithAI} 
                isEnhancing={isEnhancing} 
            />
        }
        {showConfirmationModal && itemToDelete && <ConfirmationModal isOpen={showConfirmationModal} onClose={closeModals} onConfirm={handleConfirmDelete} title="Confirm Deletion" message={`Are you sure you want to delete this ${itemToDelete.type}? This action cannot be undone.`} />}
      
        <AIAssistantButton onOpen={() => setShowAIChat(true)} />
        {showAIChat && (
          <AIChatModal
            isOpen={showAIChat}
            onClose={() => setShowAIChat(false)}
            chatHistory={aiChatHistory}
            onSubmit={handleAISubmit}
            isLoading={isAILoading}
            allPrompts={prompts}
            allNotes={notes}
            allTasks={tasks}
          />
        )}
      </div>
    </>
  );
}

// --- Floating AI Assistant Button ---
const AIAssistantButton = ({ onOpen }) => (
  <button
    onClick={onOpen}
    aria-label="Open AI Assistant"
    className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-50 p-3.5 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 text-white shadow-xl hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-purple-400/50 dark:focus:ring-purple-600/50 transform hover:scale-110 transition-all duration-200"
  >
    <SparklesIcon className="w-7 h-7" />
  </button>
);

// --- AI Chat Modal ---
const AIChatModal = ({ isOpen, onClose, chatHistory, onSubmit, isLoading, allPrompts, allNotes, allTasks }) => {
  const [userInput, setUserInput] = useState('');
  const chatEndRef = React.useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (userInput.trim() && !isLoading) {
      onSubmit(userInput.trim());
      setUserInput('');
    }
  };
  
  const renderFoundItems = (lastMessage) => {
    if (!lastMessage || !lastMessage.processed || lastMessage.processed.action !== "FIND_ITEMS") return null;
    const { itemType, data } = lastMessage.processed;
    const keywords = data?.keywords?.toLowerCase() || "";
    const status = data?.status;
    let itemsToDisplay = [];
    let sourceArray = [];

    if (itemType === ITEM_TYPES.PROMPT) sourceArray = allPrompts;
    else if (itemType === ITEM_TYPES.NOTE) sourceArray = allNotes;
    else if (itemType === ITEM_TYPES.TASK) sourceArray = allTasks;
    else sourceArray = [...allPrompts, ...allNotes, ...allTasks];
    
    if (keywords) {
        itemsToDisplay = sourceArray.filter(item => 
            item.title.toLowerCase().includes(keywords) ||
            (item.description && item.description.toLowerCase().includes(keywords)) ||
            (item.content && item.content.toLowerCase().includes(keywords))
        );
    } else { itemsToDisplay = sourceArray; }

    if (itemType === ITEM_TYPES.TASK && status && status !== 'all') {
        itemsToDisplay = itemsToDisplay.filter(task => status === 'completed' ? task.completed : !task.completed);
    }

    if (itemsToDisplay.length === 0) return <p className="text-sm text-slate-500 dark:text-slate-400 px-3 py-2">No matching {itemType !== "N/A" ? itemType : "items"} found.</p>;

    return (
      <div className="mt-2 mb-3 border-t border-slate-300/70 dark:border-slate-700/50 pt-2">
        <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-300 px-3 mb-1">Found {itemsToDisplay.length} {itemType !== "N/A" ? itemType : "item"}(s):</h4>
        <ul className="max-h-40 overflow-y-auto px-3 space-y-1">
          {itemsToDisplay.slice(0, 5).map(item => ( 
            <li key={item.id} className="text-xs text-slate-700 dark:text-slate-200 p-1.5 bg-slate-200/50 dark:bg-slate-700/40 rounded-md">
              <strong>{item.title}</strong>
              {item.description && `: ${item.description.substring(0,30)}...`}
              {item.content && `: ${item.content.substring(0,30)}...`}
              {item.dueDate && ` (Due: ${new Date(item.dueDate).toLocaleDateString()})`}
              {item.hasOwnProperty('completed') && (item.completed ? " - Completed" : " - Pending")}
            </li>
          ))}
          {itemsToDisplay.length > 5 && <li className="text-xs text-slate-500 dark:text-slate-400 p-1">...and {itemsToDisplay.length - 5} more.</li>}
        </ul>
      </div>
    );
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="✨ AI Assistant">
      <div className="flex flex-col h-[60vh] sm:h-[70vh]">
        <div className="flex-1 overflow-y-auto p-3 space-y-4 bg-slate-100/50 dark:bg-slate-900/30 rounded-t-md">
          {chatHistory.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-2.5 rounded-xl shadow ${msg.role === 'user' ? 'bg-purple-500 text-white rounded-br-none' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-none themed-background themed-text'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.parts[0].text}</p>
                {msg.role === 'model' && msg.processed && (
                  <div className="mt-2 pt-2 border-t border-slate-300/50 dark:border-slate-600/50 text-xs">
                    <p className="font-semibold text-slate-600 dark:text-slate-400">Action: <span className="font-normal">{msg.processed.action}</span></p>
                    {msg.processed.itemType && msg.processed.itemType !== "N/A" && <p className="text-slate-500 dark:text-slate-400">Type: <span className="font-normal">{msg.processed.itemType}</span></p>}
                    {msg.processed.details && <p className="text-slate-500 dark:text-slate-400">Details: <span className="font-normal">{msg.processed.details}</span></p>}
                  </div>
                )}
                 {msg.role === 'model' && renderFoundItems(msg)}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="p-3 border-t border-slate-300/70 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/70 backdrop-blur-sm rounded-b-md themed-background themed-border">
          <div className="flex items-center gap-2">
            <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder="Ask your AI assistant..."
              className="flex-1 p-2.5 rounded-lg bg-slate-100/70 dark:bg-slate-700/50 text-slate-800 dark:text-slate-100 border border-slate-300/80 dark:border-slate-600/80 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-[#7c3aed] themed-background themed-text themed-border"
              disabled={isLoading} />
            <button type="submit" disabled={isLoading}
              className="p-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 dark:from-purple-600 dark:to-blue-600 text-white font-semibold shadow-md hover:opacity-90 disabled:opacity-50 transition-opacity">
              {isLoading ? <LoadingSpinnerIcon className="w-5 h-5 animate-spin" /> : <PaperAirplaneIcon className="w-5 h-5" />}
            </button>
          </div>
        </form>
      </div>
    </ModalBase>
  );
};

// Header Component
const Header = ({ onOpenAddItemTypeModal, theme, toggleTheme }) => {
  return (
    <header className="sticky top-0 z-40 flex items-center bg-white/70 dark:bg-[#0D1117]/70 backdrop-blur-lg p-4 pb-3 justify-between border-b border-slate-300/70 dark:border-slate-700/50 themed-background themed-border">
      <div className="w-10 h-10 flex items-center">
         <ThemeSwitcher theme={theme} toggleTheme={toggleTheme} />
      </div>
      <h1 className="text-slate-800 dark:text-slate-100 text-xl font-semibold leading-tight tracking-tight text-center themed-text">
        Productivity Hub
      </h1>
      <div className="flex w-10 h-10 items-center justify-end">
        <button
          onClick={onOpenAddItemTypeModal}
          aria-label="Add new item"
          className="flex items-center justify-center rounded-full h-10 w-10 bg-slate-200/80 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 shadow-md transition-all duration-200 hover:bg-slate-300/90 dark:hover:bg-slate-600/70 hover:text-slate-800 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-offset-[#0D1117] dark:focus:ring-[#7c3aed] themed-background themed-text"
        >
          <PlusIcon />
        </button>
      </div>
    </header>
  );
};

// Add Item Type Selection Modal Component
const AddItemTypeSelectionModal = ({ isOpen, onClose, onSelectType }) => {
    if (!isOpen) return null;
    const types = [
        { label: 'New Prompt', type: ITEM_TYPES.PROMPT, icon: <LightbulbIcon /> },
        { label: 'New Note', type: ITEM_TYPES.NOTE, icon: <DocumentTextIcon /> },
        { label: 'New Task', type: ITEM_TYPES.TASK, icon: <CheckCircleIcon /> },
    ];
    const modalContainerClass = "bg-white/80 dark:bg-slate-800/70 backdrop-blur-xl rounded-xl p-4 sm:p-6 w-full max-w-xs shadow-2xl border border-slate-300/70 dark:border-slate-700/60 themed-background themed-border";

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/60 flex items-center justify-center p-4 z-50 themed-backdrop-blur" onClick={onClose}>
            <div className={`${modalContainerClass} animate-modalEnter`} onClick={e => e.stopPropagation()}>
                <h3 className="text-slate-800 dark:text-slate-100 text-lg font-semibold mb-5 text-center themed-text">What to create?</h3>
                <div className="space-y-3">
                    {types.map(item => (
                        <button
                            key={item.type}
                            onClick={() => onSelectType(item.type)}
                            className="w-full flex items-center gap-3.5 p-3.5 rounded-lg bg-slate-200/70 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 hover:bg-slate-300/80 dark:hover:bg-slate-600/70 hover:text-slate-900 dark:hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-[#7c3aed] themed-background themed-text"
                        >
                            {React.cloneElement(item.icon, { className: "w-5 h-5 text-slate-500 dark:text-slate-400 themed-text" })}
                            <span className="text-sm font-medium">{item.label}</span>
                        </button>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="mt-6 w-full px-4 py-2.5 rounded-lg bg-slate-300 dark:bg-slate-600/80 text-slate-700 dark:text-slate-200 hover:bg-slate-400/70 dark:hover:bg-slate-500/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 themed-background themed-text"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

// Bottom Navigation Component
const BottomNav = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { name: 'Home', icon: <HomeIcon />, tab: ITEM_TYPES.HOME },
    { name: 'Prompts', icon: <LightbulbIcon />, tab: ITEM_TYPES.PROMPT },
    { name: 'Notes', icon: <DocumentTextIcon />, tab: ITEM_TYPES.NOTE },
    { name: 'Tasks', icon: <CheckCircleIcon />, tab: ITEM_TYPES.TASK },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40">
      <div className="flex gap-1 border-t border-slate-300/70 dark:border-slate-700/50 bg-white/70 dark:bg-[#0D1117]/70 backdrop-blur-lg px-2 py-2 sm:px-3 sm:py-2.5 themed-background themed-border">
        {navItems.map((item) => (
          <a
            key={item.tab}
            aria-label={item.name}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-2 px-1.5 transition-all duration-200 
                        ${activeTab === item.tab ? 'bg-slate-200 dark:bg-slate-700/60 text-purple-600 dark:text-white scale-105' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/40 hover:text-slate-700 dark:hover:text-slate-100'} 
                        focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-purple-500 dark:focus:ring-offset-[#0D1117] dark:focus:ring-[#7c3aed] themed-text`}
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveTab(item.tab); }}
          >
            <div className={`flex h-5 w-5 items-center justify-center mb-0.5 transition-colors duration-200 ${activeTab === item.tab ? 'text-purple-600 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
              {item.icon}
            </div>
            <p className={`text-[10px] sm:text-xs font-medium leading-normal tracking-tight transition-colors duration-200 ${activeTab === item.tab ? 'text-purple-700 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
              {item.name}
            </p>
          </a>
        ))}
      </div>
       <div className="h-[env(safe-area-inset-bottom)] bg-white/70 dark:bg-[#0D1117]/70 backdrop-blur-lg themed-background"></div>
    </nav>
  );
};

// Card Component
const ItemCardBase = ({ children, onClick, className = "" }) => (
  <div
    className={`bg-white/60 dark:bg-slate-800/50 backdrop-blur-md rounded-xl p-4 shadow-lg border border-slate-300/50 dark:border-slate-700/40 hover:border-slate-400/70 dark:hover:border-slate-600/60 transition-all duration-200 ${onClick ? 'cursor-pointer' : ''} ${className} themed-background themed-border`}
    onClick={onClick}
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
  >
    {children}
  </div>
);

// Home Dashboard Component
const HomeDashboard = ({ prompts, notes, tasks, openDetailModal, setActiveTab }) => {
  const MAX_ITEMS_TO_SHOW = 5; 

  const summaryItems = [
    { title: 'Prompts', count: prompts.length, items: prompts.slice(0, MAX_ITEMS_TO_SHOW), type: ITEM_TYPES.PROMPT, emptyText: "No prompts yet. Spark some ideas!", icon: <LightbulbIcon className="w-5 h-5 mr-2 text-purple-500 dark:text-purple-400"/> },
    { title: 'Notes', count: notes.length, items: notes.slice(0, MAX_ITEMS_TO_SHOW), type: ITEM_TYPES.NOTE, emptyText: "No notes yet. Jot something down!", icon: <DocumentTextIcon className="w-5 h-5 mr-2 text-sky-500 dark:text-sky-400"/> },
  ];
  const pendingTasksCount = tasks.filter(t => !t.completed).length;

  return (
    <div className="px-4 py-5">
      <h2 className="text-slate-800 dark:text-slate-100 text-2xl font-semibold leading-tight tracking-tight pb-6 themed-text">Welcome, Explorer!</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {summaryItems.map(summary => (
          <ItemCardBase key={summary.type}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-slate-700 dark:text-slate-100 text-lg font-semibold flex items-center themed-text">{summary.icon} {summary.title}</h3>
              <span className="text-xs text-slate-600 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-700/50 px-2.5 py-1 rounded-full font-medium themed-background themed-text">{summary.count}</span>
            </div>
            {summary.items.length > 0 ? (
              <ul className="space-y-2.5">
                {summary.items.map((item) => (
                  <li key={item.id} className="text-slate-500 dark:text-slate-400 text-sm cursor-pointer hover:text-slate-700 dark:hover:text-slate-100 transition-colors group themed-text" onClick={() => openDetailModal(summary.type, item)}>
                    <span className="font-medium text-slate-700 dark:text-slate-200 group-hover:underline block truncate themed-text">{item.title}</span>
                    <span className="text-xs block truncate">{(item.description || item.content).substring(0, 50)}...</span>
                  </li>
                ))}
                {summary.count > MAX_ITEMS_TO_SHOW && ( 
                  <li className="text-purple-600 dark:text-purple-400 text-sm font-medium mt-3 pt-2 border-t border-slate-300/70 dark:border-slate-700/50 themed-border">
                    <a href="#" className="hover:underline" onClick={(e) => { e.preventDefault(); setActiveTab(summary.type); }}>View all {summary.title.toLowerCase()}</a>
                  </li>
                )}
              </ul>
            ) : ( <p className="text-slate-500 dark:text-slate-500 text-sm py-2 themed-text">{summary.emptyText}</p> )}
          </ItemCardBase>
        ))}
        <ItemCardBase className="md:col-span-2">
           <div className="flex justify-between items-center mb-3">
            <h3 className="text-slate-700 dark:text-slate-100 text-lg font-semibold flex items-center themed-text"><CheckCircleIcon className="w-5 h-5 mr-2 text-emerald-500 dark:text-emerald-400"/> Tasks</h3>
            <span className="text-xs text-slate-600 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-700/50 px-2.5 py-1 rounded-full font-medium themed-background themed-text">{pendingTasksCount} pending</span>
          </div>
          {tasks.length > 0 ? (
            <ul className="space-y-2.5">
              {tasks.slice(0, MAX_ITEMS_TO_SHOW).map((task) => ( 
                <li key={task.id} className={`text-slate-500 dark:text-slate-400 text-sm cursor-pointer hover:text-slate-700 dark:hover:text-slate-100 transition-colors group flex items-center justify-between ${task.completed ? 'opacity-60 dark:opacity-50' : ''} themed-text`} onClick={() => openDetailModal(ITEM_TYPES.TASK, task)}>
                  <div>
                    <span className={`font-medium text-slate-700 dark:text-slate-200 group-hover:underline ${task.completed ? 'line-through' : ''} themed-text`}>{task.title}</span>
                    {task.dueDate && <span className="text-xs ml-1 text-slate-500 dark:text-slate-500"> (Due: {new Date(task.dueDate).toLocaleDateString()})</span>}
                  </div>
                  <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center ${task.completed ? 'bg-purple-500 dark:bg-[#7c3aed] border-purple-500 dark:border-[#7c3aed]' : 'border-slate-400 dark:border-slate-600'} transition-all themed-border`}>
                    {task.completed && <CheckIcon className="w-3 h-3 text-white" />}
                  </div>
                </li>
              ))}
              {tasks.length > MAX_ITEMS_TO_SHOW && ( 
                  <li className="text-purple-600 dark:text-purple-400 text-sm font-medium mt-3 pt-2 border-t border-slate-300/70 dark:border-slate-700/50 themed-border">
                    <a href="#" className="hover:underline" onClick={(e) => { e.preventDefault(); setActiveTab(ITEM_TYPES.TASK); }}>View all tasks</a>
                  </li> 
              )}
            </ul>
          ) : ( <p className="text-slate-500 dark:text-slate-500 text-sm py-2 themed-text">No tasks yet. Get productive!</p> )}
        </ItemCardBase>
      </div>
    </div>
  );
};

// Item List Component
const ItemList = ({ type, items, openDetailModal, onUpdateItem }) => {
  const getIcon = (itemType) => {
    const baseClasses = "w-7 h-7";
    switch (itemType) {
      case ITEM_TYPES.PROMPT: return <LightbulbIcon className={`${baseClasses} text-purple-500 dark:text-purple-400`}/>;
      case ITEM_TYPES.NOTE: return <DocumentTextIcon className={`${baseClasses} text-sky-500 dark:text-sky-400`}/>;
      case ITEM_TYPES.TASK: return <CheckCircleIcon className={`${baseClasses} text-emerald-500 dark:text-emerald-400`}/>;
      default: return null;
    }
  };
  const getTitle = (itemType) => ({ prompt: 'Your Prompts', note: 'Your Notes', task: 'Your Tasks' }[itemType] || '');
  const handleTaskCheckboxChange = (task, e) => { e.stopPropagation(); onUpdateItem(ITEM_TYPES.TASK, task.id, { ...task, completed: !task.completed }); };

  return (
    <div className="px-4 py-5">
      <h2 className="text-slate-800 dark:text-slate-100 text-2xl font-semibold leading-tight tracking-tight pb-6 themed-text">{getTitle(type)}</h2>
      <div className="flex flex-col gap-3.5">
        {items.length > 0 ? (
          items.map((item) => (
            <ItemCardBase key={item.id} onClick={() => openDetailModal(type, item)} className="flex items-center gap-4 p-3.5">
              <div className="flex items-center justify-center rounded-lg bg-slate-200/60 dark:bg-slate-700/50 shrink-0 size-12 themed-background">
                {getIcon(type)}
              </div>
              <div className="flex flex-col justify-center flex-1 overflow-hidden">
                <p className="text-slate-800 dark:text-slate-100 text-base font-semibold leading-normal truncate themed-text">{item.title}</p>
                {type === ITEM_TYPES.PROMPT && <p className="text-slate-600 dark:text-slate-400 text-sm font-normal leading-normal line-clamp-1 themed-text">{item.description}</p>}
                {type === ITEM_TYPES.NOTE && <p className="text-slate-600 dark:text-slate-400 text-sm font-normal leading-normal line-clamp-1 themed-text">{item.content}</p>}
                {type === ITEM_TYPES.TASK && (
                  <p className={`text-sm font-normal leading-normal ${item.completed ? 'line-through text-slate-500 dark:text-slate-500' : 'text-slate-600 dark:text-slate-400'} themed-text`}>
                    {item.dueDate ? `Due: ${new Date(item.dueDate).toLocaleDateString()}` : 'No due date'}
                  </p>
                )}
              </div>
              {type === ITEM_TYPES.TASK && (
                <button
                  aria-label={item.completed ? "Mark task as incomplete" : "Mark task as complete"}
                  onClick={(e) => handleTaskCheckboxChange(item, e)}
                  className={`flex items-center justify-center shrink-0 w-6 h-6 rounded-md border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-offset-slate-800/50 dark:focus:ring-[#7c3aed]
                    ${item.completed ? 'bg-purple-500 dark:bg-[#7c3aed] border-purple-500 dark:border-[#7c3aed]' : 'bg-transparent border-slate-400 dark:border-slate-600 hover:border-slate-500 dark:hover:border-slate-500'} themed-border`}
                >
                  {item.completed && <CheckIcon className="w-4 h-4 text-white" />}
                </button>
              )}
            </ItemCardBase>
          ))
        ) : (
          <ItemCardBase className="text-center py-12">
            <div className="text-6xl text-slate-400 dark:text-slate-700 mb-4 mx-auto w-fit themed-text">{getIcon(type)}</div>
            <p className="text-slate-600 dark:text-slate-400 text-lg themed-text">No {type}s found yet.</p>
            <p className="text-slate-500 dark:text-slate-500 text-sm themed-text">Click the '+' button in the header to add your first one!</p>
          </ItemCardBase>
        )}
      </div>
    </div>
  );
};

// Base Modal Component
const ModalBase = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;
  return (
    <div 
      className="fixed inset-0 bg-black/50 dark:bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-md themed-backdrop-blur" 
      onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title"
    >
      <div 
        className="bg-white/80 dark:bg-slate-800/70 backdrop-blur-xl rounded-xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-slate-300/70 dark:border-slate-700/60 animate-modalEnter themed-background themed-border"
        onClick={e => e.stopPropagation()}
      >
        {title && <h3 id="modal-title" className="text-slate-800 dark:text-slate-100 text-xl font-semibold mb-6 text-center capitalize themed-text">{title}</h3>}
        {children}
      </div>
    </div>
  );
};

// Add Item Modal Component
const AddItemModal = ({ isOpen, onClose, type, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState(''); 
  const [content, setContent] = useState(''); 
  const [dueDate, setDueDate] = useState(''); 

  useEffect(() => { if (isOpen) { setTitle(''); setDescription(''); setContent(''); setDueDate(''); } }, [isOpen, type]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) { console.error("Title cannot be empty."); alert("Title cannot be empty."); return; }
    let data = { title: title.trim() };
    if (type === ITEM_TYPES.PROMPT) data.description = description.trim();
    else if (type === ITEM_TYPES.NOTE) data.content = content.trim();
    else if (type === ITEM_TYPES.TASK) { data.completed = false; if (dueDate) data.dueDate = new Date(dueDate); }
    onSave(type, data); // Will call handleAddItem from App.js
  };

  const commonInputClasses = "w-full p-3 rounded-lg bg-slate-100/70 dark:bg-slate-700/50 text-slate-800 dark:text-slate-100 border border-slate-300/80 dark:border-slate-600/80 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-[#7c3aed] focus:border-purple-500 dark:focus:border-[#7c3aed] placeholder-slate-500 dark:placeholder-slate-400 transition-colors themed-background themed-text themed-border";
  const labelClasses = "block text-slate-700 dark:text-slate-300 text-sm font-medium mb-1.5 themed-text";

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={`Add New ${type}`}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div><label htmlFor="title" className={labelClasses}>Title</label><input type="text" id="title" placeholder={`Enter ${type} title...`} className={commonInputClasses} value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
        {type === ITEM_TYPES.PROMPT && (<div><label htmlFor="description" className={labelClasses}>Description</label><textarea id="description" rows="3" placeholder="Describe your prompt..." className={commonInputClasses} value={description} onChange={(e) => setDescription(e.target.value)} required></textarea></div>)}
        {type === ITEM_TYPES.NOTE && (<div><label htmlFor="content" className={labelClasses}>Content</label><textarea id="content" rows="4" placeholder="Write your note here..." className={commonInputClasses} value={content} onChange={(e) => setContent(e.target.value)} required></textarea></div>)}
        {type === ITEM_TYPES.TASK && (<div><label htmlFor="dueDate" className={labelClasses}>Due Date (Optional)</label><input type="date" id="dueDate" className={`${commonInputClasses} appearance-none`} value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>)}
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg bg-slate-200 dark:bg-slate-600/80 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-500/90 transition-colors duration-200 themed-background themed-text">Cancel</button>
          <button type="submit" className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 dark:from-purple-600 dark:to-blue-600 text-white font-semibold shadow-lg hover:from-purple-600 hover:to-blue-600 dark:hover:from-purple-700 dark:hover:to-blue-700 transition-all duration-200">Add {type}</button>
        </div>
      </form>
    </ModalBase>
  );
};

// Detail/Edit Item Modal Component - Modified to include "Enhance Prompt" button
const DetailModal = ({ isOpen, onClose, type, item, onUpdate, onDelete, onEnhancePrompt, isEnhancing }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (item) { 
      setTitle(item.title || ''); 
      setDescription(item.description || ''); 
      setContent(item.content || ''); 
      setDueDate(item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : ''); 
      setCompleted(item.completed || false); 
    } else { 
      setTitle(''); setDescription(''); setContent(''); setDueDate(''); setCompleted(false); 
    }
  }, [item]); 

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!title.trim()) { console.error("Title cannot be empty."); alert("Title cannot be empty."); return; }
    let data = { title: title.trim() };
    if (type === ITEM_TYPES.PROMPT) data.description = description.trim();
    else if (type === ITEM_TYPES.NOTE) data.content = content.trim();
    else if (type === ITEM_TYPES.TASK) { data.completed = completed; data.dueDate = dueDate ? new Date(dueDate) : null; }
    onUpdate(type, item.id, data);
  };
  
  const handleEnhanceClick = () => {
    if (type === ITEM_TYPES.PROMPT && item) {
        onEnhancePrompt(item, description); 
    }
  };

  const commonInputClasses = "w-full p-3 rounded-lg bg-slate-100/70 dark:bg-slate-700/50 text-slate-800 dark:text-slate-100 border border-slate-300/80 dark:border-slate-600/80 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-[#7c3aed] focus:border-purple-500 dark:focus:border-[#7c3aed] placeholder-slate-500 dark:placeholder-slate-400 transition-colors themed-background themed-text themed-border";
  const labelClasses = "block text-slate-700 dark:text-slate-300 text-sm font-medium mb-1.5 themed-text";
  const currentItem = item || { createdAt: new Date() };

  return (
    <ModalBase isOpen={isOpen && item} onClose={onClose} title={`Edit ${type}`}>
      <form onSubmit={handleUpdate} className="space-y-5">
        <div><label htmlFor="editTitle" className={labelClasses}>Title</label><input type="text" id="editTitle" className={commonInputClasses} value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
        
        {type === ITEM_TYPES.PROMPT && (
          <div>
            <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="editDescription" className={labelClasses}>Description</label>
                <button 
                    type="button" 
                    onClick={handleEnhanceClick}
                    disabled={isEnhancing}
                    className="text-xs px-2 py-1 rounded-md bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white transition-colors flex items-center gap-1 disabled:opacity-70"
                >
                    {isEnhancing ? <LoadingSpinnerIcon className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}
                    Enhance ✨
                </button>
            </div>
            <textarea id="editDescription" rows="4" className={commonInputClasses} value={description} onChange={(e) => setDescription(e.target.value)} required></textarea>
          </div>
        )}

        {type === ITEM_TYPES.NOTE && (<div><label htmlFor="editContent" className={labelClasses}>Content</label><textarea id="editContent" rows="4" className={commonInputClasses} value={content} onChange={(e) => setContent(e.target.value)} required></textarea></div>)}
        {type === ITEM_TYPES.TASK && (<><div><label htmlFor="editDueDate" className={labelClasses}>Due Date (Optional)</label><input type="date" id="editDueDate" className={`${commonInputClasses} appearance-none`} value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div><div className="flex items-center pt-1"><input type="checkbox" id="editCompleted" className="form-checkbox h-5 w-5 text-purple-600 dark:text-[#7c3aed] rounded-md border-slate-400 dark:border-slate-500 bg-slate-100/70 dark:bg-slate-700/50 focus:ring-purple-500 dark:focus:ring-[#7c3aed] focus:ring-offset-white dark:focus:ring-offset-slate-800/70 themed-background themed-border" checked={completed} onChange={(e) => setCompleted(e.target.checked)} /><label htmlFor="editCompleted" className="ml-2.5 text-slate-700 dark:text-slate-300 text-sm font-medium themed-text">Completed</label></div></>)}
        
        <p className="text-xs text-slate-500 dark:text-slate-500 pt-1 themed-text">Created: {new Date(currentItem.createdAt).toLocaleString()}</p>
        <div className="flex justify-between items-center gap-3 pt-4">
          <button type="button" onClick={() => onDelete(type, currentItem.id)} className="px-5 py-2.5 rounded-lg bg-red-600/90 dark:bg-red-700/80 text-white hover:bg-red-700/95 dark:hover:bg-red-600/90 transition-colors duration-200">Delete</button>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg bg-slate-200 dark:bg-slate-600/80 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-500/90 transition-colors duration-200 themed-background themed-text">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 dark:from-purple-600 dark:to-blue-600 text-white font-semibold shadow-lg hover:from-purple-600 hover:to-blue-600 dark:hover:from-purple-700 dark:hover:to-blue-700 transition-all duration-200">Save Changes</button>
          </div>
        </div>
      </form>
    </ModalBase>
  );
};

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => (
  <ModalBase isOpen={isOpen} onClose={onClose}>
    <h3 id="confirmation-modal-title" className="text-slate-800 dark:text-slate-100 text-xl font-semibold mb-4 text-center themed-text">{title}</h3>
    <p className="text-slate-600 dark:text-slate-400 text-sm mb-7 text-center themed-text">{message}</p>
    <div className="flex justify-center gap-4">
      <button onClick={onClose} className="px-6 py-2.5 rounded-lg bg-slate-200 dark:bg-slate-600/80 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-500/90 transition-colors duration-200 themed-background themed-text">Cancel</button>
      <button onClick={onConfirm} className="px-6 py-2.5 rounded-lg bg-red-500 dark:bg-red-600/90 text-white hover:bg-red-600 dark:hover:bg-red-500/90 transition-colors duration-200">Confirm Delete</button>
    </div>
  </ModalBase>
);


// SVG Icons
const PlusIcon = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg> );
const HomeIcon = ({ className = "w-full h-full" }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg> );
const LightbulbIcon = ({ className = "w-full h-full" }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.354a15.055 15.055 0 0 1-3 0M12 3c2.667 0 4.933 1.022 6.5 2.667M12 3c-2.667 0-4.933 1.022-6.5 2.667M12 3v1.5M12 9a3 3 0 0 1 3 3m-3-3a3 3 0 0 0-3 3m0 0h6m-6 3.75h6.75m-6.75 0H4.5v4.5H12M12 9V6.75M9.75 6.75H12m2.25 0H12m2.25 0H14.25m-2.25 0H9.75" /></svg> );
const DocumentTextIcon = ({ className = "w-full h-full" }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg> );
const CheckCircleIcon = ({ className = "w-full h-full" }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg> );
const CheckIcon = ({ className = "w-full h-full" }) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg> );
const SunIcon = ({ className = "w-4 h-4" }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-6.364-.386 1.591-1.591M3 12h2.25m.386-6.364 1.591 1.591M12 6a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z" /></svg> );
const MoonIcon = ({ className = "w-4 h-4" }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" /></svg> );
const SparklesIcon = ({ className = "w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.25 12L17 13.75M18.25 12L19.5 10.25M18.25 12L16.5 10.25M18.25 12L20.5 13.75M12 1.25L10.25 2.5M12 1.25L13.75 2.5M12 1.25L10.25 0M12 1.25L13.75 0M12 22.75L10.25 21.5M12 22.75L13.75 21.5M12 22.75L10.25 24M12 22.75L13.75 24M1.25 12L2.5 13.75M1.25 12L0 10.25M1.25 12L2.5 10.25M1.25 12L0 13.75M22.75 12L21.5 13.75M22.75 12L24 10.25M22.75 12L21.5 10.25M22.75 12L24 13.75" /></svg>);
const PaperAirplaneIcon = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>);
const LoadingSpinnerIcon = ({ className = "w-5 h-5" }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>);

export default App;
