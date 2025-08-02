import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Download } from 'lucide-react';
import { jsPDF } from "jspdf";

import './App.css'; // Import the external CSS file

// Helper function for a typewriter effect
const useTypewriter = (text, speed = 30) => {
  const [displayText, setDisplayText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeoutId = setTimeout(() => {
        setDisplayText(prev => prev + text.charAt(index));
        setIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timeoutId);
    }
  }, [text, speed, index]);

  return displayText;
};

// Main App component
const App = () => {
  // State for messages, input, and loading status
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);
  const [chatAnimationKey, setChatAnimationKey] = useState(0);

  // State for document content and styling options
  const initialDocumentContent = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Morbi vitae risus quis tellus tincidunt tristique. Vivamus ac diam in nisl semper facilisis. In hac habitasse platea dictumst. Sed in urna id justo ultricies blandit. Praesent a nunc eu justo vestibulum bibendum. Maecenas vel libero eget turpis hendrerit malesuada. Integer euismod, libero id vehicula iaculis, nisi metus ultrices magna, vitae tincidunt leo felis non erat. Aenean non arcu eget justo aliquam hendrerit. Suspendisse potenti. Nam a ligula vel velit lacinia facilisis.

Curabitur pretium tincidunt lacus. Nulla facilisi. Sed non arcu non erat tempus mollis. Quisque scelerisque scelerisque elit. Aenean aliquet, magna in accumsan iaculis, dolor enim convallis mi, sit amet varius sem justo a magna. Maecenas tristique, purus quis dictum aliquam, massa libero rutrum enim, eget iaculis massa risus sit amet nisi.

Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Donec interdum, mi vel iaculis interdum, purus nisl dictum urna, sed interdum lacus sem eu arcu. Vivamus quis magna at mi aliquam dictum. Proin id massa. Donec pretium, nunc vitae eleifend pulvinar, nunc purus aliquam tortor, vel tempus diam ipsum eget lacus. Sed in eros ac sem mollis dictum. Quisque eu justo a lorem hendrerit fermentum. Nullam consequat, libero sit amet viverra varius, libero odio bibendum dolor, a facilisis metus quam ac justo.`;
  const [documentContent, setDocumentContent] = useState(initialDocumentContent);

  // States for selected font, size, and color
  const [fontFamily, setFontFamily] = useState('Inter, sans-serif');
  const [fontSize, setFontSize] = useState('1rem');
  const [textColor, setTextColor] = useState('#1f2937');

  const documentRef = useRef(null); // Ref for the content-editable div

  // DocsX initial message
  const welcomeText = "Hello! I am DocsX. How can I help you start your essay?";
  const typedWelcomeText = useTypewriter(welcomeText);

  // Scroll to the bottom of the chat window whenever messages or loading status update
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Function to call the new chat API
  const callChatApi = async (prompt) => {
    setIsLoading(true);
    // The new API endpoint provided by the user
    const apiUrl = `https://yearly-notable-newt.ngrok-free.app/docsx/chat/prompt`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        // Sending the prompt in a JSON body as expected by the new endpoint
        body: JSON.stringify({ prompt: prompt })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      // Assuming the new API returns a JSON object with a 'text' key
      if (result.text) {
        return result.text;
      } else {
        return "Sorry, I couldn't generate a response from the new endpoint. Please try again.";
      }
    } catch (error) {
      console.error('Error fetching from new chat API:', error);
      return "An error occurred while connecting to the new chat API.";
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for sending a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === '' || isLoading) return;

    const userMessage = { text: input, sender: 'user' };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');

    // Call the new chat API to get a real response
    const geminiResponseText = await callChatApi(input);
    const geminiMessage = { text: geminiResponseText, sender: 'DocsX' };

    setMessages(prevMessages => [...prevMessages, geminiMessage]);
    setChatAnimationKey(prevKey => prevKey + 1);
  };

  // Handler for downloading the document content
  const handleDownload = () => {
    if (!documentRef.current) return;

    // Get the plain text content or HTML content of the document
    const content = documentRef.current.innerText; // Use innerText for simple text
    // If you want to include styling/HTML, you'll need a more complex method or html2canvas

    // Create jsPDF instance
    const doc = new jsPDF({
      unit: 'pt',
      format: 'a4',
    });

    // Split text into lines that fit page width
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    const maxLineWidth = pageWidth - 2 * margin;
    const lines = doc.splitTextToSize(content, maxLineWidth);

    // Add text to PDF starting with some margin
    doc.text(lines, margin, 60);

    // Save the PDF with a filename
    doc.save("symphony-of-silence.pdf");
  };

  // Handler to update the document content state from the content-editable div
  const handleDocumentInput = () => {
    setDocumentContent(documentRef.current.innerHTML);
  };

  // Function to apply styles to the selected text
  const applyStyle = (command, value) => {
    document.execCommand(command, false, value);
    // Force a re-render to update the state with new styling
    handleDocumentInput();
  };
  
  const handleRephrase = async () => {
    if (!documentRef.current) return;

    const selection = window.getSelection();

    if (!selection.rangeCount) {
      alert("Please select some text in the document to rephrase.");
      return;
    }

    const range = selection.getRangeAt(0);

    if (!documentRef.current.contains(range.commonAncestorContainer)) {
      alert("Please select text inside the document editor.");
      return;
    }

    const selectedText = selection.toString();

    if (!selectedText.trim()) {
      alert("Please select some text to rephrase.");
      return;
    }

    setIsLoading(true);

    try {
      // Call your rephrase endpoint
      const response = await fetch('https://yearly-notable-newt.ngrok-free.app/docsx/chat/rephrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: selectedText }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const rephrasedText = result.text || "No rephrased text returned.";

      range.deleteContents();
      range.insertNode(document.createTextNode(rephrasedText));
      selection.collapseToEnd();

      setDocumentContent(documentRef.current.innerHTML);
      setMessages(prev => [...prev, { text: "Selected text rephrased successfully.", sender: 'system' }]);
    } catch (error) {
      console.error("Rephrase error:", error);
      alert("Failed to rephrase selected text. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // The useEffect that was here has been removed.
  // The initial content is now handled solely by dangerouslySetInnerHTML,
  // which prevents the content from being reset after every edit.

  return (
    <div className="app-container">
      <div className="left-panel">
        <div className="panel-controls">
          <button onClick={handleDownload} className="download-button">
            <Download size={16} />
            Download
          </button>
          <button onClick={handleRephrase} className="rephrase-button" disabled={isLoading}>
            Rephrase
          </button>
          {/* Font and Text Customization Controls */}
          <div className="font-controls">
            <label htmlFor="font-select" className="control-label">Font:</label>
            <select
              id="font-select"
              value={fontFamily}
              onChange={(e) => {
                setFontFamily(e.target.value);
                applyStyle('fontName', e.target.value);
              }}
              className="control-select"
            >
              <option value="Inter, sans-serif">Inter</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="Arial, sans-serif">Arial</option>
              <option value="Courier New, monospace">Courier New</option>
            </select>
          </div>
          <div className="size-controls">
            <label htmlFor="size-select" className="control-label">Size:</label>
            <select
              id="size-select"
              value={fontSize}
              onChange={(e) => {
                setFontSize(e.target.value);
                // execCommand uses 1-7, so we need to map our sizes
                let execCommandSize;
                switch(e.target.value) {
                  case '0.8rem': execCommandSize = '2'; break;
                  case '1rem': execCommandSize = '3'; break;
                  case '1.2rem': execCommandSize = '4'; break;
                  case '1.5rem': execCommandSize = '5'; break;
                  default: execCommandSize = '3';
                }
                applyStyle('fontSize', execCommandSize);
              }}
              className="control-select"
            >
              <option value="0.8rem">Small</option>
              <option value="1rem">Normal</option>
              <option value="1.2rem">Large</option>
              <option value="1.5rem">Extra Large</option>
            </select>
          </div>
          <div className="color-controls">
            <label htmlFor="color-select" className="control-label">Color:</label>
            <select
              id="color-select"
              value={textColor}
              onChange={(e) => {
                setTextColor(e.target.value);
                applyStyle('foreColor', e.target.value);
              }}
              className="control-select"
            >
              <option value="#1f2937">Black</option>
              <option value="#dc2626">Red</option>
              <option value="#22c55e">Green</option>
              <option value="#3b82f6">Blue</option>
            </select>
          </div>
        </div>

        {/* Replaced textarea with a content-editable div */}
        <div
          ref={documentRef}
          className="document-editor"
          contentEditable="true"
          onInput={handleDocumentInput}
        />
      </div>
      <div className="right-panel">
        <header className="header">
          <h1 className="flex items-center text-gray-800">
            <Sparkles className="icon" />
            <span>DocsX</span>
          </h1>
          <p>start essaying</p>
        </header>

        <div className="main-chat-container">
          <main className="main-chat" key={chatAnimationKey}>
            <div className="message-container gemini">
              <div className="message-bubble gemini">
                <p className="sender">DocsX</p>
                <p className="content">{typedWelcomeText}</p>
              </div>
            </div>

            {messages.map((msg, index) => (
              <div key={index} className={`message-container ${msg.sender}`}>
                <div className={`message-bubble ${msg.sender}`}>
                  <p className="sender">{msg.sender === 'user' ? 'You' : 'DocsX'}</p>
                  <p className="content">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="loading-indicator">
                <div className="message-bubble gemini">
                  <p className="sender">DocsX</p>
                  <p className="content">Thinking<span className="animate-pulse">...</span></p>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </main>
        </div>

        <form onSubmit={handleSendMessage} className="input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Start with your essay topic..."
            className="input-field"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="send-button"
            disabled={!input.trim() || isLoading}
          >
            <Send className="icon" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;
