// Video Tool — free video trimmer, client-side only.
// No server, no login, no payment. Files never leave this device.
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var video = $('video');
  var fileInput = $('fileInput');
  var dropZone = $('dropZone');
  var editor = $('editor');
  var videoInfo = $('videoInfo');
  var startRange = $('startRange');
  var endRange = $('endRange');
  var startLabel = $('startLabel');
  var endLabel = $('endLabel');
  var trimLength = $('trimLength');
  var exportStatus = $('exportStatus');
  var exportProgress = $('exportProgress');
  var exportBtn = $('exportBtn');

  var currentFile = null;
  var currentUrl = null;
  var duration = 0;
  var exporting = false;

  function fmt(seconds) {
    if (!isFinite(seconds) || seconds < 0) seconds = 0;
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function fmtSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function startSec() { return (parseFloat(startRange.value) / 100) * duration; }
  function endSec() { return (parseFloat(endRange.value) / 100) * duration; }

  function updateTrimLabels() {
    if (!duration) return;
    var s = startSec();
    var e = endSec();
    if (s >= e) {
      if (document.activeElement === startRange) { s = Math.max(0, e - 0.1); startRange.value = (s / duration) * 100; }
      else { e = Math.min(duration, s + 0.1); endRange.value = (e / duration) * 100; }
    }
    startLabel.textContent = fmt(startSec());
    endLabel.textContent = fmt(endSec());
    trimLength.textContent = fmt(Math.max(0, endSec() - startSec()));
  }

  function updateInfo() {
    if (!currentFile || !duration) { videoInfo.textContent = '—'; return; }
    videoInfo.textContent = 'File: ' + currentFile.name +
      '  •  Size: ' + fmtSize(currentFile.size) +
      '  •  Duration: ' + fmt(duration) +
      '  •  Resolution: ' + (video.videoWidth || '?') + ' x ' + (video.videoHeight || '?');
  }

  function loadFile(file) {
    if (!file) return;
    if (!file.type || file.type.indexOf('video/') !== 0) {
      exportStatus.textContent = 'Please choose a video file.';
      return;
    }
    if (currentUrl) URL.revokeObjectURL(currentUrl);
    currentFile = file;
    currentUrl = URL.createObjectURL(file);
    video.src = currentUrl;
    video.load();
    editor.hidden = false;
    exportStatus.textContent = 'Video loaded. Drag the trim sliders, then export.';
    dropZone.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  $('pickBtn').addEventListener('click', function () { fileInput.click(); });
  fileInput.addEventListener('change', function () { loadFile(fileInput.files[0]); });

  ['dragenter', 'dragover'].forEach(function (ev) {
    dropZone.addEventListener(ev, function (e) { e.preventDefault(); dropZone.classList.add('drag'); });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    dropZone.addEventListener(ev, function (e) { e.preventDefault(); dropZone.classList.remove('drag'); });
  });
  dropZone.addEventListener('drop', function (e) {
    var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    loadFile(f);
  });
  dropZone.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
  });

  video.addEventListener('loadedmetadata', function () {
    duration = video.duration || 0;
    startRange.value = 0;
    endRange.value = 100;
    updateTrimLabels();
    updateInfo();
  });

  startRange.addEventListener('input', function () {
    updateTrimLabels();
    if (video.currentTime < startSec()) video.currentTime = startSec();
  });
  endRange.addEventListener('input', function () {
    updateTrimLabels();
    if (video.currentTime > endSec()) video.currentTime = endSec();
  });

  video.addEventListener('timeupdate', function () {
    if (!$('loopTrim').checked || !duration) return;
    if (video.currentTime >= endSec()) {
      if (video.paused) video.currentTime = startSec();
      else video.currentTime = startSec();
    }
    if (video.currentTime < startSec()) video.currentTime = startSec();
  });

  $('playBtn').addEventListener('click', function () {
    if (video.paused) { if (video.currentTime >= endSec()) video.currentTime = startSec(); video.play(); }
    else video.pause();
  });
  $('muteBtn').addEventListener('click', function () {
    video.muted = !video.muted;
    this.textContent = video.muted ? '🔇 Muted' : '🔊 Sound on';
  });
  $('speedSel').addEventListener('change', function () {
    video.playbackRate = parseFloat(this.value);
  });
  $('previewTrimBtn').addEventListener('click', function () {
    video.currentTime = startSec();
    video.play();
  });

  function downloadBlob(blob, filename) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  function baseName(name) {
    return (name || 'video').replace(/\.[^.]+$/, '');
  }

  $('thumbBtn').addEventListener('click', function () {
    if (!currentFile || !video.videoWidth) {
      exportStatus.textContent = 'Load a video first, then capture a thumbnail.';
      return;
    }
    try {
      var canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(function (blob) {
        if (!blob) { exportStatus.textContent = 'Could not capture this frame. Try pausing the video first.'; return; }
        downloadBlob(blob, baseName(currentFile.name) + '-thumbnail.png');
        exportStatus.textContent = 'Thumbnail saved as PNG.';
      }, 'image/png');
    } catch (err) {
      exportStatus.textContent = 'Could not capture this frame: ' + err.message;
    }
  });

  $('shareBtn').addEventListener('click', function () {
    var url = window.location.href;
    function done() { exportStatus.textContent = 'Link copied — share it anywhere.'; }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = url; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { exportStatus.textContent = 'Copy this link: ' + url; }
      ta.remove();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, fallback);
    } else fallback();
  });

  // ---- Export: try ffmpeg.wasm first, fall back to MediaRecorder ----
  async function exportWithFfmpeg() {
    var mod = await import('https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.11.6/+esm');
    var createFFmpeg = mod.createFFmpeg;
    var fetchFile = mod.fetchFile;
    var ffmpeg = createFFmpeg({ log: false });
    exportStatus.textContent = 'Loading converter (first use downloads it, please wait)...';
    exportProgress.hidden = false;
    ffmpeg.setProgress(function (p) { exportProgress.value = Math.round((p.ratio || 0) * 100); });
    await ffmpeg.load();
    var inputName = 'input' + (currentFile.name.match(/\.[^.]+$/) || ['.mp4'])[0];
    ffmpeg.FS('writeFile', inputName, await fetchFile(currentFile));
    var outName = 'output.mp4';
    await ffmpeg.run('-ss', String(startSec().toFixed(2)), '-to', String(endSec().toFixed(2)),
      '-i', inputName, '-c:v', 'libx264', '-c:a', 'aac', '-movflags', '+faststart', outName);
    var data = ffmpeg.FS('readFile', outName);
    var blob = new Blob([data.buffer], { type: 'video/mp4' });
    downloadBlob(blob, baseName(currentFile.name) + '-trimmed.mp4');
    exportStatus.textContent = 'Done — trimmed clip downloaded (' + fmtSize(blob.size) + ').';
    exportProgress.hidden = true;
    return true;
  }

  function exportWithRecorder() {
    return new Promise(function (resolve, reject) {
      try {
        var stream = video.captureStream ? video.captureStream() : null;
        if (!stream) { reject(new Error('This browser cannot re-record video.')); return; }
        var mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' :
          MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : '';
        var rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
        var chunks = [];
        rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
        rec.onstop = function () {
          var blob = new Blob(chunks, { type: mime || 'video/webm' });
          downloadBlob(blob, baseName(currentFile.name) + '-trimmed.webm');
          exportStatus.textContent = 'Done — trimmed clip downloaded as WebM (' + fmtSize(blob.size) + '). Note: the fast converter was unavailable, so this is a re-recorded copy.';
          resolve(true);
        };
        rec.onerror = function () { reject(new Error('Recording failed.')); };
        video.currentTime = startSec();
        video.muted = false;
        video.play().then(function () {
          rec.start();
          var len = Math.max(0.5, endSec() - startSec()) * 1000;
          setTimeout(function () { try { rec.stop(); } catch (e) {} video.pause(); }, len);
        }).catch(reject);
      } catch (err) { reject(err); }
    });
  }

  exportBtn.addEventListener('click', async function () {
    if (!currentFile || !duration) {
      exportStatus.textContent = 'Load a video first.';
      return;
    }
    if (exporting) return;
    exporting = true;
    exportBtn.disabled = true;
    try {
      await exportWithFfmpeg();
    } catch (err) {
      exportStatus.textContent = 'Fast converter unavailable (' + (err && err.message ? err.message : 'offline') + '). Trying the built-in recorder instead...';
      try {
        await exportWithRecorder();
      } catch (err2) {
        exportStatus.textContent = 'Export failed: ' + (err2 && err2.message ? err2.message : 'unknown error') + ' You can still preview the trimmed range and save a thumbnail.';
      }
    } finally {
      exporting = false;
      exportBtn.disabled = false;
      exportProgress.hidden = true;
    }
  });
})();
