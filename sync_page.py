#!/usr/bin/env python
"""
Sync ai-chat page to Frappe database
Run this from the bench directory:
    bench --site v16.com execute frappe_developer_tools.sync_page.sync_ai_chat_page
"""

import frappe
import json
import os


def sync_ai_chat_page():
    """Sync the ai-chat page to database"""
    
    # Read the page JSON file
    page_json_path = os.path.join(
        os.path.dirname(__file__),
        'frappe_developer_tools/ai_module/page/ai_chat/ai_chat.json'
    )
    
    with open(page_json_path, 'r') as f:
        page_data = json.load(f)
    
    # Check if page exists
    if frappe.db.exists('Page', 'ai-chat'):
        print("Page 'ai-chat' already exists. Updating...")
        page = frappe.get_doc('Page', 'ai-chat')
        page.update(page_data)
        page.save()
        print("✅ Page updated successfully")
    else:
        print("Creating new page 'ai-chat'...")
        page = frappe.get_doc({
            'doctype': 'Page',
            'name': 'ai-chat',
            **page_data
        })
        page.insert()
        print("✅ Page created successfully")
    
    frappe.db.commit()
    print("✅ Database committed")
    print("\nPage 'ai-chat' is now available at: /app/ai-chat")


if __name__ == '__main__':
    sync_ai_chat_page()
