document.addEventListener('DOMContentLoaded', (event) => {
    const joinScreen = document.getElementById('join-screen');
    const editorScreen = document.getElementById('editor-screen');
    const userNameInput = document.getElementById('userName');
    const joinButton = document.getElementById('join-button');
    const usersDiv = document.getElementById('users');
    const editorDiv = document.getElementById('editor');
    const fileList = document.getElementById('file-list');
    const newFileButton = document.getElementById('new-file');
    const openFileInput = document.getElementById('open-file');
    const shareLinkButton = document.getElementById('share-link');
    let editor, ws, currentFile = null;

    joinButton.addEventListener('click', () => {
        const userName = userNameInput.value.trim();
        if (userName) {
            joinSession(userName);
        }
    });

    newFileButton.addEventListener('click', () => {
        const fileName = prompt("Enter the name of the new file:");
        if (fileName) {
            ws.send(JSON.stringify({
                type: 'new_file',
                fileName: fileName
            }));
        }
    });

    openFileInput.addEventListener('change', (event) => {
        const files = event.target.files;
        for (const file of files) {
            const reader = new FileReader();
            reader.onload = () => {
                ws.send(JSON.stringify({
                    type: 'open_file',
                    fileName: file.name,
                    content: reader.result
                }));
            };
            reader.readAsText(file);
        }
    });

    shareLinkButton.addEventListener('click', () => {
        const sessionId = getSessionId();
        const shareLink = `${window.location.origin}${window.location.pathname}?session=${sessionId}`;
        navigator.clipboard.writeText(shareLink).then(() => {
            alert('Share link copied to clipboard!');
        });
    });

    function generateSessionId() {
        return 'session-' + Math.random().toString(36).substr(2, 9);
    }

    function getSessionId() {
        const urlParams = new URLSearchParams(window.location.search);
        let sessionId = urlParams.get('session');
        if (!sessionId) {
            sessionId = generateSessionId();
            urlParams.set('session', sessionId);
            window.history.replaceState(null, null, '?' + urlParams.toString());
        }
        return sessionId;
    }

    function joinSession(userName) {
        const sessionId = getSessionId();

        ws = new WebSocket('ws://localhost:8080');

        ws.onopen = () => {
            ws.send(JSON.stringify({
                type: 'join',
                sessionId: sessionId,
                userName: userName
            }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'init') {
                editorScreen.style.display = 'flex';
                joinScreen.style.display = 'none';

                editor = CodeMirror(editorDiv, {
                    lineNumbers: true,
                    mode: "javascript",
                    theme: "default",
                    value: data.code
                });

                data.users.forEach(user => addUser(user));
                data.files.forEach(file => addFile(file));

                editor.on('change', (instance, changeObj) => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({
                            type: 'update',
                            code: editor.getValue(),
                            fileName: currentFile
                        }));
                    }
                });
            } else if (data.type === 'update') {
                if (editor.getValue() !== data.code) {
                    editor.setValue(data.code);
                }
            } else if (data.type === 'user_joined') {
                addUser(data.userName);
            } else if (data.type === 'user_left') {
                removeUser(data.userName);
            } else if (data.type === 'new_file') {
                addFile(data.fileName);
            } else if (data.type === 'open_file') {
                currentFile = data.fileName;
                if (editor.getValue() !== data.code) {
                    editor.setValue(data.code);
                }
            }
        };

        function addUser(userName) {
            const userDiv = document.createElement('div');
            userDiv.className = 'user';
            userDiv.textContent = userName;
            usersDiv.appendChild(userDiv);
        }

        function removeUser(userName) {
            const userDivs = usersDiv.getElementsByClassName('user');
            for (let userDiv of userDivs) {
                if (userDiv.textContent === userName) {
                    usersDiv.removeChild(userDiv);
                    break;
                }
            }
        }

        function addFile(fileName) {
            const fileItem = document.createElement('li');
            fileItem.textContent = fileName;
            fileItem.addEventListener('click', () => {
                ws.send(JSON.stringify({
                    type: 'open_file',
                    fileName: fileName
                }));
            });
            fileList.appendChild(fileItem);
        }
    }

    // Save file with Ctrl+S
    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            if (currentFile) {
                const blob = new Blob([editor.getValue()], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = currentFile;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                alert('File saved successfully!');
            } else {
                alert('No file is currently open to save.');
            }
        }
    });

    // Function to handle the share link button click

    // Function to handle the share link button click
    shareLinkButton.addEventListener('click', () => {
        const sessionId = getSessionId();
        const shareLink = `${window.location.origin}${window.location.pathname}?session=${sessionId}`;
        navigator.clipboard.writeText(shareLink).then(() => {
            alert('Share link copied to clipboard!');
        });
    });

    function generateSessionId() {
        return 'session-' + Math.random().toString(36).substr(2, 9);
    }

    function getSessionId() {
        const urlParams = new URLSearchParams(window.location.search);
        let sessionId = urlParams.get('session');
        if (!sessionId) {
            sessionId = generateSessionId();
            urlParams.set('session', sessionId);
            window.history.replaceState(null, null, '?' + urlParams.toString());
        }
        return sessionId;
    }

    function joinSession(userName) {
        const sessionId = getSessionId();

        ws = new WebSocket('ws://localhost:8080');

        ws.onopen = () => {
            ws.send(JSON.stringify({
                type: 'join',
                sessionId: sessionId,
                userName: userName
            }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'init') {
                editorScreen.style.display = 'flex';
                joinScreen.style.display = 'none';

                editor = CodeMirror(editorDiv, {
                    lineNumbers: true,
                    mode: "javascript",
                    theme: "default",
                    value: data.code
                });

                data.users.forEach(user => addUser(user));
                data.files.forEach(file => addFile(file));

                editor.on('change', (instance, changeObj) => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({
                            type: 'update',
                            code: editor.getValue(),
                            fileName: currentFile
                        }));
                    }
                });
            } else if (data.type === 'update') {
                if (editor.getValue() !== data.code) {
                    editor.setValue(data.code);
                }
            } else if (data.type === 'user_joined') {
                addUser(data.userName);
            } else if (data.type === 'user_left') {
                removeUser(data.userName);
            } else if (data.type === 'new_file') {
                addFile(data.fileName);
            } else if (data.type === 'open_file') {
                currentFile = data.fileName;
                if (editor.getValue() !== data.code) {
                    editor.setValue(data.code);
                }
            }
        };

        function addUser(userName) {
            const userDiv = document.createElement('div');
            userDiv.className = 'user';
            userDiv.textContent = userName;
            usersDiv.appendChild(userDiv);
        }

        function removeUser(userName) {
            const userDivs = usersDiv.getElementsByClassName('user');
            for (let userDiv of userDivs) {
                if (userDiv.textContent === userName) {
                    usersDiv.removeChild(userDiv);
                    break;
                }
            }
        }

        function addFile(fileName) {
            const fileItem = document.createElement('li');
            fileItem.textContent = fileName;
            fileItem.addEventListener('click', () => {
                ws.send(JSON.stringify({
                    type: 'open_file',
                    fileName: fileName
                }));
            });
            fileList.appendChild(fileItem);
        }
    }
});
