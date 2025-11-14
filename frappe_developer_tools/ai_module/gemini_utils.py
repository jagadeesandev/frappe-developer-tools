# Copyright (c) 2025, You and contributors
# For license information, please see license.txt

import frappe
import google.generativeai as genai
from typing import Optional, Dict, Any


class GeminiAPIManager:
	"""Manager for Google Gemini API interactions"""
	
	def __init__(self, api_key: Optional[str] = None):
		"""Initialize Gemini API with API key"""
		if not api_key:
			api_key = frappe.db.get_single_value("Frappe Developer Tools Settings", "gemini_api_key")
		
		if not api_key:
			frappe.throw("Gemini API Key not configured. Please set it in Frappe Developer Tools Settings.")
		
		genai.configure(api_key=api_key)
		self.model = genai.GenerativeModel('gemini-pro')
	
	def get_chat_response(self, messages: list) -> Dict[str, Any]:
		"""
		Send messages to Gemini API and get response
		
		Args:
			messages: List of message dictionaries with 'role' and 'content'
		
		Returns:
			Dictionary with response text and token usage
		"""
		try:
			# Convert messages to Gemini format
			chat_messages = []
			for msg in messages:
				chat_messages.append({
					"role": "user" if msg.get("role") == "user" else "model",
					"parts": [msg.get("content", "")]
				})
			
			# Start chat session
			chat = self.model.start_chat(history=chat_messages[:-1])
			
			# Send the latest message
			response = chat.send_message(chat_messages[-1]["parts"][0])
			
			return {
				"success": True,
				"response": response.text,
				"tokens_used": None  # Gemini doesn't expose token count in free tier
			}
		except Exception as e:
			frappe.log_error(f"Gemini API Error: {str(e)}", "Gemini Chat Error")
			return {
				"success": False,
				"error": str(e)
			}


def preprocess_query(query: str) -> str:
	"""
	Preprocess user query for better NLP understanding
	
	Args:
		query: Raw user input
	
	Returns:
		Processed query
	"""
	# Remove extra whitespace
	query = " ".join(query.split())
	
	# Convert to lowercase for processing
	processed = query.lower()
	
	# Remove common filler words for cleaner processing
	filler_words = ["um", "uh", "like", "you know", "basically", "actually"]
	for word in filler_words:
		processed = processed.replace(f" {word} ", " ")
	
	return processed.strip()


@frappe.whitelist()
def send_chat_message(chat_id: str, message: str) -> Dict[str, Any]:
	"""
	API endpoint to send a chat message and get AI response
	
	Args:
		chat_id: ID of the AI Chat document
		message: User message text
	
	Returns:
		Response with AI answer and updated chat
	"""
	try:
		# Get or create chat session
		if chat_id == "new":
			chat_doc = frappe.new_doc("AI Chat")
			chat_doc.title = message[:50]  # Use first 50 chars as title
			chat_doc.user = frappe.session.user
			chat_doc.status = "Active"
			chat_doc.model = "gemini-pro"
		else:
			chat_doc = frappe.get_doc("AI Chat", chat_id)
		
		# Preprocess the user query
		processed_message = preprocess_query(message)
		
		# Add user message to chat
		chat_doc.append("messages", {
			"role": "user",
			"content": message,
			"timestamp": frappe.utils.now()
		})
		
		# Get conversation history
		history = []
		for msg in chat_doc.messages:
			history.append({
				"role": msg.role,
				"content": msg.content
			})
		
		# Get AI response
		gemini_manager = GeminiAPIManager()
		ai_response = gemini_manager.get_chat_response(history)
		
		if not ai_response.get("success"):
			frappe.throw(f"Failed to get AI response: {ai_response.get('error')}")
		
		# Add AI response to chat
		chat_doc.append("messages", {
			"role": "assistant",
			"content": ai_response.get("response"),
			"timestamp": frappe.utils.now(),
			"tokens_used": ai_response.get("tokens_used")
		})
		
		# Update token count if available
		if ai_response.get("tokens_used"):
			chat_doc.total_tokens = (chat_doc.total_tokens or 0) + ai_response.get("tokens_used")
		
		# Save chat document
		chat_doc.save(ignore_permissions=True)
		frappe.db.commit()
		
		return {
			"success": True,
			"chat_id": chat_doc.name,
			"response": ai_response.get("response"),
			"chat": chat_doc.as_dict()
		}
	
	except Exception as e:
		frappe.log_error(frappe.get_traceback(), "Chat Message Error")
		return {
			"success": False,
			"error": str(e)
		}


@frappe.whitelist()
def get_chat_history(chat_id: str) -> Dict[str, Any]:
	"""Get full chat history"""
	try:
		chat_doc = frappe.get_doc("AI Chat", chat_id)
		return {
			"success": True,
			"chat": chat_doc.as_dict()
		}
	except Exception as e:
		return {
			"success": False,
			"error": str(e)
		}
