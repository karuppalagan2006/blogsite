// script.js - client-side blog + comments using localStorage

// helper utils
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);

const STORAGE_KEY = "blog_with_comments_v1";

function loadData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { posts: [] };
  } catch(e) {
    return { posts: [] };
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// initial load
let db = loadData();

// UI elements
const postsList = document.getElementById("posts-list");
const publishBtn = document.getElementById("publish-btn");
const titleInput = document.getElementById("post-title");
const contentInput = document.getElementById("post-content");

const postView = document.getElementById("post-view");
const feedSection = document.getElementById("feed");
const backBtn = document.getElementById("back-btn");
const viewTitle = document.getElementById("view-title");
const viewMeta = document.getElementById("view-meta");
const viewContent = document.getElementById("view-content");
const commentsList = document.getElementById("comments-list");
const commentsCount = document.getElementById("comments-count");
const commentAuthor = document.getElementById("comment-author");
const commentText = document.getElementById("comment-text");
const addCommentBtn = document.getElementById("add-comment-btn");

let currentPostId = null;

// render feed
function renderFeed() {
  postsList.innerHTML = "";
  const posts = db.posts.slice().sort((a,b)=>b.createdAt - a.createdAt);
  if(!posts.length) {
    postsList.innerHTML = `<p style="color:#666">No posts yet. Publish one above!</p>`;
    return;
  }
  posts.forEach(p => {
    const div = document.createElement("div");
    div.className = "post-card";
    div.innerHTML = `
      <h3 data-id="${p.id}">${escapeHtml(p.title)}</h3>
      <p>${escapeHtml(p.content.slice(0,150))}${p.content.length>150? '...' : ''}</p>
      <small style="color:#999">By <strong>${escapeHtml(p.author||"Anonymous")}</strong> • ${new Date(p.createdAt).toLocaleString()} • ${p.comments?.length || 0} comments</small>
    `;
    postsList.appendChild(div);
    div.querySelector("h3").addEventListener("click", () => openPost(p.id));
  });
}

// open post view
function openPost(id) {
  const post = db.posts.find(x=>x.id===id);
  if(!post) return alert("Post not found");
  currentPostId = id;
  viewTitle.textContent = post.title;
  viewMeta.textContent = `Published: ${new Date(post.createdAt).toLocaleString()}`;
  viewContent.textContent = post.content;
  feedSection.classList.add("hidden");
  postView.classList.remove("hidden");
  renderComments(post);
}

// render comments for a post
function renderComments(post) {
  commentsList.innerHTML = "";
  const comments = (post.comments || []).slice().sort((a,b)=>a.createdAt - b.createdAt);
  commentsCount.textContent = comments.length;
  if(!comments.length) {
    commentsList.innerHTML = `<p style="color:#666">No comments yet. Be the first to comment!</p>`;
    return;
  }
  comments.forEach(c => {
    const d = document.createElement("div");
    d.className = "comment";
    d.innerHTML = `
      <p class="meta"><strong>${escapeHtml(c.author||"Anonymous")}</strong> • ${new Date(c.createdAt).toLocaleString()}</p>
      <p>${escapeHtml(c.text)}</p>
      <div style="margin-top:6px">
        <button data-cid="${c.id}" class="edit-btn">Edit</button>
        <button data-cid="${c.id}" class="del-btn">Delete</button>
      </div>
    `;
    commentsList.appendChild(d);

    d.querySelector(".edit-btn").addEventListener("click", ()=> editComment(post.id, c.id));
    d.querySelector(".del-btn").addEventListener("click", ()=> deleteComment(post.id, c.id));
  });
}

// publish new post
publishBtn.addEventListener("click", ()=>{
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  if(!title || !content) return alert("Please add title and content.");
  const newPost = {
    id: uid(),
    title,
    content,
    author: "Anonymous",
    createdAt: Date.now(),
    comments: []
  };
  db.posts.push(newPost);
  saveData(db);
  titleInput.value = "";
  contentInput.value = "";
  renderFeed();
});

// back to feed
backBtn.addEventListener("click", ()=>{
  postView.classList.add("hidden");
  feedSection.classList.remove("hidden");
  currentPostId = null;
});

// add comment
addCommentBtn.addEventListener("click", ()=>{
  if(!currentPostId) return;
  const author = commentAuthor.value.trim() || "Anonymous";
  const text = commentText.value.trim();
  if(!text) return alert("Please write a comment.");
  const post = db.posts.find(x=>x.id===currentPostId);
  if(!post) return alert("Post not found");
  post.comments = post.comments || [];
  post.comments.push({ id: uid(), author, text, createdAt: Date.now() });
  saveData(db);
  commentAuthor.value = "";
  commentText.value = "";
  renderComments(post);
  renderFeed();
});

// edit comment (simple prompt)
function editComment(postId, commentId) {
  const post = db.posts.find(x=>x.id===postId);
  if(!post) return;
  const c = post.comments.find(x=>x.id===commentId);
  if(!c) return;
  const newText = prompt("Edit your comment:", c.text);
  if(newText === null) return; // cancelled
  c.text = newText;
  c.updatedAt = Date.now();
  saveData(db);
  renderComments(post);
  renderFeed();
}

// delete comment
function deleteComment(postId, commentId) {
  const post = db.posts.find(x=>x.id===postId);
  if(!post) return;
  if(!confirm("Delete this comment?")) return;
  post.comments = post.comments.filter(x=>x.id !== commentId);
  saveData(db);
  renderComments(post);
  renderFeed();
}

// helper: escape html
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// initial render
renderFeed();