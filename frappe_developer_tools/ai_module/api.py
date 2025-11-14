# Copyright (c) 2025, You and contributors
# For license information, please see license.txt

import frappe
import json
from datetime import datetime
from frappe.utils import get_datetime
from frappe_developer_tools.ai_module.gemini_utils import send_message_to_gemini


@frappe.whitelist()
def send_chat_message(chat_id, message):
	"""
	Send a message to Gemini API and save to database
	
	Args:
		chat_id: Chat document ID or 'new' for new chat
		message: User message text
	
	Returns:
		dict with success status, chat_id, and response
	"""
	try:
		# Validate input
		if not message or not message.strip():
			return {
				'success': False,
				'error': 'Message cannot be empty'
			}

		user = frappe.session.user
		
		# Create new chat if needed
		if chat_id == 'new':
			chat = frappe.get_doc({
				'doctype': 'AI Chat',
				'user': user,
				'title': message[:50] + ('...' if len(message) > 50 else ''),
				'status': 'Active'
			})
			chat.insert()
			chat_id = chat.name
		else:
			# Verify chat ownership
			chat = frappe.get_doc('AI Chat', chat_id)
			if chat.user != user:
				return {
					'success': False,
					'error': 'Unauthorized access to this chat'
				}
		
		# Save user message
		user_msg = frappe.get_doc({
			'doctype': 'AI Chat Message',
			'chat': chat_id,
			'role': 'user',
			'content': message,
			'timestamp': datetime.now()
		})
		user_msg.insert()

		# Get response from Gemini
		ai_response = send_message_to_gemini(message, chat_id)
		
		if not ai_response or not ai_response.get('success'):
			return {
				'success': False,
				'error': ai_response.get('error', 'Failed to get response from AI')
			}

		# Save AI response
		ai_msg = frappe.get_doc({
			'doctype': 'AI Chat Message',
			'chat': chat_id,
			'role': 'ai',
			'content': ai_response['response'],
			'timestamp': datetime.now()
		})
		ai_msg.insert()

		# Update chat modified time
		chat.modified = datetime.now()
		chat.save()

		frappe.db.commit()

		return {
			'success': True,
			'chat_id': chat_id,
			'response': ai_response['response'],
			'message_id': ai_msg.name
		}

	except Exception as e:
		frappe.log_error(frappe.get_traceback(), 'AI Chat Error')
		return {
			'success': False,
			'error': str(e)
		}


@frappe.whitelist()
def get_chat_history():
	"""
	Get recent chats for current user
	
	Returns:
		list of chat documents
	"""
	try:
		user = frappe.session.user
		chats = frappe.db.get_list(
			'AI Chat',
			filters={'user': user},
			fields=['name', 'title', 'modified', 'status'],
			order_by='modified desc',
			limit_page_length=20
		)
		return chats
	except Exception as e:
		frappe.log_error(frappe.get_traceback(), 'Get Chat History Error')
		return []


@frappe.whitelist()
def get_chat_messages(chat_id):
	"""
	Get all messages for a specific chat
	
	Args:
		chat_id: Chat document ID
	
	Returns:
		list of messages formatted for frontend
	"""
	try:
		# Verify chat ownership
		chat = frappe.get_doc('AI Chat', chat_id)
		if chat.user != frappe.session.user:
			frappe.throw('Unauthorized access', frappe.PermissionError)

		messages = frappe.db.get_list(
			'AI Chat Message',
			filters={'chat': chat_id},
			fields=['role', 'content', 'timestamp'],
			order_by='creation asc'
		)

		# Format messages for frontend
		formatted_messages = []
		for msg in messages:
			formatted_messages.append({
				'role': msg.role,
				'content': msg.content,
				'timestamp': msg.timestamp
			})

		return formatted_messages

	except frappe.DoesNotExistError:
		frappe.throw('Chat not found', frappe.DoesNotExistError)
	except Exception as e:
		frappe.log_error(frappe.get_traceback(), 'Get Chat Messages Error')
		frappe.throw(str(e))


@frappe.whitelist()
def delete_chat(chat_id):
	"""
	Delete a chat and all its messages
	
	Args:
		chat_id: Chat document ID
	"""
	try:
		chat = frappe.get_doc('AI Chat', chat_id)
		if chat.user != frappe.session.user:
			frappe.throw('Unauthorized access', frappe.PermissionError)

		# Delete all messages
		frappe.db.delete('AI Chat Message', {'chat': chat_id})

		# Delete chat
		frappe.delete_doc('AI Chat', chat_id)
		frappe.db.commit()

		return {'success': True}

	except Exception as e:
		frappe.log_error(frappe.get_traceback(), 'Delete Chat Error')
		return {
			'success': False,
			'error': str(e)
		}
