#!/usr/bin/env python3
"""
ZonexDev Clean URL Development Server
Supports clean route URLs (/about, /company, /services, /contact, etc.)
without trailing index.html or 404 on refresh.
"""

import http.server
import socketserver
import os
import posixpath
import urllib.parse
import sys

PORT = int(os.environ.get("PORT", sys.argv[1] if len(sys.argv) > 1 else 3000))
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

class CleanRouteHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT_DIR, **kwargs)

    def translate_path(self, path):
        # Abandon query parameters and fragment
        path = path.split('?', 1)[0]
        path = path.split('#', 1)[0]
        
        # Don't forget trailing slash
        trailing_slash = path.rstrip().endswith('/')
        try:
            path = urllib.parse.unquote(path, errors='surrogatepass')
        except UnicodeDecodeError:
            path = urllib.parse.unquote(path)
            
        path = posixpath.normpath(path)
        words = path.split('/')
        words = [_f for _f in words if _f]
        
        target = ROOT_DIR
        for word in words:
            if os.path.dirname(word) or word in (os.curdir, os.pardir):
                continue
            target = os.path.join(target, word)
            
        if trailing_slash:
            target += '/'

        # If direct path exists, return it
        if os.path.exists(target):
            if os.path.isdir(target):
                index = os.path.join(target, "index.html")
                if os.path.exists(index):
                    return index
            return target

        # Check if directory with index.html exists
        dir_index = os.path.join(target, "index.html")
        if os.path.exists(dir_index):
            return dir_index

        # Check if .html file exists
        html_file = target + ".html"
        if os.path.exists(html_file):
            return html_file

        # Check company alias
        if path.strip('/') == 'company':
            company_dir = os.path.join(ROOT_DIR, "company", "index.html")
            if os.path.exists(company_dir):
                return company_dir
            about_dir = os.path.join(ROOT_DIR, "about", "index.html")
            if os.path.exists(about_dir):
                return about_dir

        return target

    def end_headers(self):
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        super().end_headers()

    def send_error(self, code, message=None, explain=None):
        if code == 404:
            not_found_path = os.path.join(ROOT_DIR, "404.html")
            if os.path.exists(not_found_path):
                self.send_response(404)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.end_headers()
                with open(not_found_path, 'rb') as f:
                    self.wfile.write(f.read())
                return
        super().send_error(code, message, explain)

def run():
    port = PORT
    while True:
        try:
            with socketserver.TCPServer(("", port), CleanRouteHTTPHandler) as httpd:
                print(f"\n======================================================")
                print(f"⚡ ZonexDev Python Development Server")
                print(f"======================================================")
                print(f"🌐 Local URL:    http://localhost:{port}/")
                print(f"📁 Clean Routes: /company, /about, /services, /contact")
                print(f"======================================================\n")
                httpd.serve_forever()
        except OSError as e:
            if e.errno == 48 or 'Address already in use' in str(e):
                port += 1
            else:
                raise

if __name__ == '__main__':
    try:
        run()
    except KeyboardInterrupt:
        print("\nServer stopped.")
