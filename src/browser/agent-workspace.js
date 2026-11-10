/* Local folder storage for the standalone ClassJourney browser application. */
(() => {
  'use strict';
  const clone = value => structuredClone(value);
  const MAX_BYTES = 150000000;
  const COLLECTION = 'data/browser-collection.classjourney.json';
  const SYNC = 'data/browser-sync.json';
  const OUTPUT = 'output/Sammlung.classjourney.json';
  const MARKER = 'BROWSER-Verbindung.json';
  const STATUS = 'output/BROWSER-Status.json';
  const encoder = new TextEncoder();
  function normalizeAgentPath(raw, folderName) {
    let value = String(raw || '').trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1).trim();
    if (!value || value.length > 1024 || /[\x00-\x1f]/.test(value)) throw new Error('Bitte den vollständigen Ordnerpfad aus dem Explorer oder Finder einfügen.');
    const windows = /^[a-zA-Z]:[\\/]/.test(value);
    if (windows) {
      value = value.replaceAll('/', '\\').replace(/\\+$/, '');
      if (/[<>"|?*]/.test(value) || value.slice(2).includes(':')) throw new Error('Der Windows-Ordnerpfad ist ungültig.');
    } else if (value.startsWith('/') && !value.startsWith('//')) value = value.replace(/\/+$/, '');
    else throw new Error('Bitte einen vollständigen lokalen Pfad verwenden, z. B. C:\\Users\\Name\\Documents\\ClassJourney.');
    const parts = value.split(windows ? '\\' : '/');
    if (parts.some(part => part === '.' || part === '..')) throw new Error('Bitte den vollständigen Ordnerpfad ohne «..» verwenden.');
    const leaf = parts.at(-1);
    if (folderName && (windows ? leaf.toLowerCase() !== folderName.toLowerCase() : leaf !== folderName)) throw new Error('Der Pfad muss mit dem ausgewählten Ordner «' + folderName + '» enden.');
    return value;
  }
  const hash = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(typeof value === 'string' ? value : JSON.stringify(value)))), n => n.toString(16).padStart(2, '0')).join('');
  const notFound = error => error?.name === 'NotFoundError';
  async function prepareWorkspaceDirectory(selected) {
    const hasFile = async name => {
      try { await selected.getFileHandle(name); return true; }
      catch (error) { if (notFound(error)) return false; throw error; }
    };
    // Existing workspaces and an explicitly selected ClassJourney folder are used directly.
    if (selected.name.toLowerCase() === 'classjourney' || await hasFile('BROWSER-Verbindung.json') || await hasFile('APP-Verbindung.json')) return {root: selected, created: false};
    try { return {root: await selected.getDirectoryHandle('ClassJourney'), created: false}; }
    catch (error) {
      if (error.name === 'TypeMismatchError') throw new Error('Hier gibt es bereits eine Datei namens «ClassJourney». Bitte einen anderen Ablageort auswählen.');
      if (!notFound(error)) throw error;
    }
    return {root: await selected.getDirectoryHandle('ClassJourney', {create: true}), created: true};
  }
  const stamp = file => `${file.lastModified}:${file.size}`;
  function hasher() {
    const cache = new WeakMap();
    return value => {
      if (!value || typeof value !== 'object') return hash(value);
      if (!cache.has(value)) cache.set(value, hash(value));
      return cache.get(value);
    };
  }
  const planKey = async (plan, assets, digest) => hash([await digest(plan), await digest(assets.backgrounds[plan.backgroundId])]);
  async function baseline(collection) {
    const digest = hasher(), base = {};
    for (const plan of collection.plans) base[plan.id] = await planKey(plan, collection.assets, digest);
    return {base, accepted: {}, lastOutput: null};
  }
  async function mergeCollections(current, incoming, previous = {}) {
    if (current.libraryId !== incoming.libraryId) throw new Error('Die KI-Ausgabe gehört zu einer anderen Sammlung.');
    const data = clone(current), sync = clone(previous), digest = hasher();
    sync.base ||= {}; sync.accepted ||= {};
    const result = {added: 0, updated: 0, conflicts: 0, planIds: []};
    const unique = (prefix, fingerprint, exists) => {
      const root = prefix.slice(0, 65) + '-ki-' + fingerprint.slice(0, 12);
      let id = root, n = 2;
      while (exists(id)) id = root + '-' + n++;
      return id;
    };
    for (const source of incoming.plans) {
      const seen = await planKey(source, incoming.assets, digest), record = sync.accepted[source.id];
      if (record?.seen === seen || (!record && sync.base[source.id] === seen)) continue;
      let targetId = record?.targetId || source.id;
      let target = data.plans.find(p => p.id === targetId);
      const expected = record?.saved || sync.base[source.id];
      if (target && await planKey(target, data.assets, digest) === seen) {
        sync.accepted[source.id] = {seen, targetId, saved: seen}; continue;
      }
      let conflict = false;
      if ((target && await planKey(target, data.assets, digest) !== expected) || (!target && expected)) {
        // Recover an already committed conflict copy after an interrupted metadata write.
        const prefix = source.id.slice(0, 65) + '-ki-' + seen.slice(0, 12);
        let recovered;
        for (const candidate of data.plans.filter(p => p.id.startsWith(prefix))) {
          const normalized = {...candidate, id: source.id, title: source.title, backgroundId: source.backgroundId};
          if (await digest(normalized) === await digest(source) && await digest(data.assets.backgrounds[candidate.backgroundId]) === await digest(incoming.assets.backgrounds[source.backgroundId])) { recovered = candidate; break; }
        }
        if (recovered) {
          sync.accepted[source.id] = {seen, targetId: recovered.id, saved: await planKey(recovered, data.assets, digest)}; continue;
        }
        conflict = true;
        targetId = unique(source.id, seen, id => data.plans.some(p => p.id === id));
      }
      const plan = clone(source); plan.id = targetId;
      if (targetId !== source.id) plan.title = (source.title + ' (KI)').slice(0, 180);
      const background = incoming.assets.backgrounds[source.backgroundId];
      if (!background) throw new Error('Ein Hintergrund der KI-Ausgabe fehlt.');
      let backgroundId = source.backgroundId;
      if (data.assets.backgrounds[backgroundId] && await digest(data.assets.backgrounds[backgroundId]) !== await digest(background)) {
        const fingerprint = await digest(background), prefix = backgroundId.slice(0, 65) + '-ki-' + fingerprint.slice(0, 12);
        backgroundId = prefix; let n = 2;
        while (data.assets.backgrounds[backgroundId] && await digest(data.assets.backgrounds[backgroundId]) !== fingerprint) backgroundId = prefix + '-' + n++;
      }
      data.assets.backgrounds[backgroundId] = clone(background); plan.backgroundId = backgroundId;
      const index = data.plans.findIndex(p => p.id === targetId);
      if (index >= 0) { data.plans[index] = plan; result.updated++; }
      else { data.plans.push(plan); result.added++; }
      if (conflict) result.conflicts++;
      result.planIds.push(targetId);
      sync.accepted[source.id] = {seen, targetId, saved: await planKey(plan, data.assets, hasher())};
    }
    if (result.planIds.length) data.modifiedAt = Math.max(Date.now(), current.modifiedAt + 1);
    return {...result, collection: data, sync};
  }
  class Workspace {
    constructor(options) {
      this.options = options; this.root = null; this.remembered = null; this.connected = false;
      this.sync = {}; this.queue = Promise.resolve(); this.revision = 0; this.lastLocalSave = 0;
      this.imagePaths = new Map(); this.imageStamps = new Map(); this.lastReadable = null;
      this.status = {kind: 'none', text: ''}; this.connectionKey = options.getCollection().libraryId;
      this.agentVerified = false; this.agentVerification = null;
    }
    report(kind, text) { this.status = {kind, text, name: this.root?.name || this.remembered?.name || ''}; this.options.onStatus?.(this.status); }
    enqueue(job) { const next = this.queue.then(job); this.queue = next.catch(() => {}); return next; }
    async database() {
      if (!this.db) this.db = await new Promise((resolve, reject) => {
        const req = indexedDB.open('classjourney-browser-folders-v1', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('connections');
        req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
      });
      return this.db;
    }
    async rememberedRecord(value) {
      const db = await this.database();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('connections', value === undefined ? 'readonly' : 'readwrite');
        const store = tx.objectStore('connections');
        const req = value === undefined ? store.get(this.connectionKey) : value === null ? store.delete(this.connectionKey) : store.put(value, this.connectionKey);
        let result; req.onsuccess = () => { result = req.result; };
        tx.oncomplete = () => resolve(result); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
      });
    }
    async restore() {
      try {
        const record = await this.rememberedRecord(); if (!record?.handle) return;
        this.remembered = record.handle;
        if (await this.remembered.queryPermission({mode: 'readwrite'}) !== 'granted') { this.report('permission', 'Speicherordner: Zugriff erneut bestätigen'); return; }
        await this.connect(this.remembered, {existing: true});
      } catch (error) { this.fail(error); }
    }
    async resume() {
      if (!this.remembered) throw new Error('Bitte zuerst einen Speicherordner auswählen.');
      if (await this.remembered.requestPermission({mode: 'readwrite'}) !== 'granted') { this.report('permission', 'Ordnerzugriff wurde nicht freigegeben.'); return false; }
      return this.connect(this.remembered, {existing: true});
    }
    async handle(path, create = false) {
      const parts = path.split('/');
      if (parts.some(p => !p || p === '.' || p === '..' || p.includes('\\') || p.includes(':'))) throw new Error('Ungültiger Dateipfad.');
      let directory = this.root;
      for (const part of parts.slice(0, -1)) directory = await directory.getDirectoryHandle(part, {create});
      return directory.getFileHandle(parts.at(-1), {create});
    }
    async read(path) {
      const handle = await this.handle(path), before = await handle.getFile();
      if (before.size > MAX_BYTES) throw new Error('Die Datei ist grösser als 150 MB.');
      const text = await before.text(), after = await handle.getFile();
      if (stamp(before) !== stamp(after)) throw new Error('Die Datei wird gerade geändert. Bitte kurz warten.');
      return {text, stamp: stamp(after)};
    }
    async optional(path) { try { return await this.read(path); } catch (error) { if (notFound(error)) return null; throw error; } }
    async write(path, content) {
      const payload = typeof content === 'string' ? new Blob([content]) : content;
      if (path === COLLECTION && payload.size > MAX_BYTES) throw new Error('Die Sammlung ist grösser als 150 MB. Die bisherige Ordnersicherung bleibt erhalten; die Änderungen sind weiterhin im Browser gespeichert.');
      const handle = await this.handle(path, true), writer = await handle.createWritable();
      try { await writer.write(payload); await writer.close(); } catch (error) { try { await writer.abort(); } catch {} throw error; }
      return stamp(await handle.getFile());
    }
    async json(path, value) {
      // Images are immutable files shared by the working copy and snapshots.
      // Only exports for deliberate sharing need embedded images.
      const compact = path === COLLECTION || path.startsWith('backups/');
      return this.write(path, JSON.stringify(compact ? await this.compactCollection(value) : value));
    }
    validate(raw) {
      const collection = this.options.validate(raw);
      for (const plan of collection.plans) if (!collection.assets.backgrounds[plan.backgroundId]) throw new Error('In der Sammlung fehlt ein Hintergrund.');
      return collection;
    }
    async lock(id) {
      if (!navigator.locks) return;
      let acquired;
      const ready = new Promise(resolve => { acquired = resolve; });
      this.lockJob = navigator.locks.request('classjourney-folder-' + id, {ifAvailable: true}, async lock => {
        if (!lock) { acquired(false); return; }
        await new Promise(resolve => { this.releaseLock = resolve; acquired(true); });
      });
      if (!await ready) throw new Error('Dieser Speicherordner ist bereits in einem anderen ClassJourney-Fenster verbunden.');
    }
    async connect(root, {existing = false, preparation = null, enteredPath = ''} = {}) {
      return this.enqueue(async () => {
        if (this.connected || this.root) throw new Error('Trenne zuerst den bisherigen Speicherordner.');
        this.imagePaths.clear(); this.imageStamps.clear();
        this.agentVerified = false; this.agentVerification = null;
        this.root = root; this.report('writing', 'Speicherordner wird geprüft …');
        this.options.setImporting?.(true);
        try {
          const native = await this.optional('APP-Verbindung.json');
          if (native && JSON.parse(native.text).automaticImport) throw new Error('Dieser Ordner gehört zur installierten App. Erstelle für die Browserversion einen eigenen ClassJourney-Ordner.');
          const markerFile = await this.optional(MARKER);
          let marker, current = this.validate(this.options.getCollection());
          if (markerFile) {
            marker = JSON.parse(markerFile.text);
            if (marker.format !== 'classjourney-browser-link' || marker.version !== 1 || typeof marker.workspaceId !== 'string' || !/^[a-zA-Z0-9-]{1,100}$/.test(marker.workspaceId)) throw new Error('Dieser Ordner ist kein unterstützter ClassJourney-Speicherordner.');
            if (enteredPath && !this.samePath(enteredPath, marker.agentRoot, root.name)) throw new Error('Der ausgewählte Ordner passt nicht zum eingefügten Pfad.');
            const disk = await this.read(COLLECTION), saved = await this.inflateReadable(JSON.parse(disk.text));
            if (saved.libraryId !== marker.libraryId) throw new Error('Die Sammlung passt nicht zur Ordnerverbindung.');
            if (saved.libraryId !== current.libraryId && !existing) {
              this.root = null; this.report('none', '');
              return {choice: true, handle: root, plans: saved.plans.length};
            }
            await this.lock(marker.workspaceId);
            this.diskStamp = disk.stamp;
            const syncFile = await this.optional(SYNC);
            this.sync = syncFile ? JSON.parse(syncFile.text) : await baseline(saved);
            if (!this.sync.base || !this.sync.accepted) this.sync = await baseline(saved);
            const readable = await this.optional('data/plans.json');
            this.lastReadable = readable?.text || null;
            this.readableProtected = !!readable && this.sync.readableHash !== await hash(readable.text);
            if (readable && !this.readableProtected) this.bindImagePaths(JSON.parse(readable.text), saved);
            // Different libraries are opened deliberately; in the same library retain newer browser edits.
            current = saved.libraryId !== current.libraryId || saved.modifiedAt >= current.modifiedAt ? saved : current;
            this.marker = marker;
            await this.options.onApply(current, {restored: true});
          } else {
            if (!preparation) throw new Error('Dieser Ordner wurde noch nicht von deiner KI vorbereitet. Kopiere zuerst die Startanweisung.');
            const prepared = await this.optional('BROWSER-Vorbereitung.json');
            if (!prepared) throw new Error('Die Vorbereitung fehlt. Wähle genau den Ordner, dessen Pfad deine KI zurückgegeben hat.');
            const proof = JSON.parse(prepared.text);
            if (proof.format !== 'classjourney-browser-setup' || proof.version !== 1 || proof.workspaceId !== preparation.workspaceId || proof.libraryId !== current.libraryId || proof.token !== preparation.token || !Number.isFinite(proof.preparedAt) || proof.preparedAt <= 0 || !this.samePath(enteredPath, proof.root, root.name)) throw new Error('Pfad oder Einrichtungskennung stimmt nicht. Bitte den Ordner aus dieser Startanweisung auswählen.');
            for (const required of ['START_HERE.md', 'Anweisungen KI-Agent/class-journey/SKILL.md', 'Anweisungen KI-Agent/class-journey/references/LEKTIONEN.json', 'Anweisungen KI-Agent/class-journey/references/DATENFORMAT.json']) {
              const file = await this.optional(required); if (!file?.text.trim()) throw new Error('Die KI-Vorbereitung ist unvollständig: ' + required);
            }
            const previous = await this.optional(COLLECTION);
            if (previous) {
              const saved = await this.inflateReadable(JSON.parse(previous.text));
              if (saved.libraryId !== current.libraryId) throw new Error('Dieser vorbereitete Ordner enthält eine andere Sammlung.');
              current = saved;
            } else if (await this.optional('data/plans.json')) throw new Error('Der Ordner enthält bereits Pläne ohne abgeschlossene Verbindung. Bitte zuerst die KI-Vorbereitung prüfen.');
            marker = {format: 'classjourney-browser-link', version: 1, workspaceId: preparation.workspaceId, libraryId: current.libraryId, agentRoot: normalizeAgentPath(proof.root, root.name), agentCheckToken: preparation.token, automaticImport: true, output: OUTPUT, status: STATUS, storage: COLLECTION};
            await this.lock(marker.workspaceId); this.marker = marker;
            this.sync = await baseline(current); this.readableProtected = false;
            for (const file of this.options.supportFiles()) await this.write(file.name, file.content);
            // The connection marker is the last initialization write, so incomplete folders are never silently adopted.
            await this.publishReadable(current, true);
            this.diskStamp = await this.json(COLLECTION, current);
            await this.json(SYNC, this.sync);
            await this.json(MARKER, marker);
            await this.json('output/KI-Verbindung.json', {status: 'verified', workspaceId: marker.workspaceId, libraryId: marker.libraryId, token: marker.agentCheckToken, root: marker.agentRoot, verifiedAt: proof.preparedAt});
          }
          this.connected = true; this.remembered = root;
          await this.rememberedRecord({handle: root});
          this.report('connected', 'Im Speicherordner gesichert');
          // A rejected agent output must not prevent reopening the last good collection.
          try { await this._inspect(true); }
          catch (error) {
            if (['NotAllowedError', 'SecurityError'].includes(error?.name)) throw error;
            this.fail(error);
          }
          if (current.modifiedAt > (await this.diskCollection()).modifiedAt) await this._save(current);
          clearInterval(this.timer); this.timer = setInterval(() => this.inspect().catch(error => this.fail(error)), 2000);
          return {connected: true, name: root.name};
        } catch (error) {
          this.connected = false; this.root = null; this.releaseLock?.(); this.releaseLock = null;
          this.fail(error); throw error;
        } finally {
          this.options.setImporting?.(false);
        }
      });
    }
    samePath(a, b, name) {
      const left = normalizeAgentPath(a, name), right = normalizeAgentPath(b, name);
      return /^[a-zA-Z]:/.test(left) ? left.toLowerCase() === right.toLowerCase() : left === right;
    }
    async diskCollection() { return this.inflateReadable(JSON.parse((await this.read(COLLECTION)).text)); }
    async setAgentPath(raw, makePrompt) {
      return this.enqueue(async () => {
        if (!this.connected) throw new Error('Bitte zuerst den Speicherordner auswählen und freigeben.');
        const path = normalizeAgentPath(raw, this.root.name);
        await this.assertDiskUnchanged();
        const next = {...this.marker, agentRoot: path};
        if (path !== this.marker.agentRoot || !this.marker.agentCheckToken) next.agentCheckToken = crypto.randomUUID();
        const prompt = makePrompt(next);
        if (this.options.verifier) await this.write('scripts/verify_agent_folder.py', this.options.verifier());
        await this.write('START_PROMPT.txt', prompt);
        await this.json(MARKER, next);
        const changed = next.agentCheckToken !== this.marker.agentCheckToken;
        this.marker = next;
        if (changed) { this.agentVerified = false; this.agentVerification = null; }
        this.report('connected', 'Im Speicherordner gesichert');
        return next;
      });
    }
    async checkAgent() {
      let verification = null;
      if (this.marker?.agentRoot && this.marker.agentCheckToken) {
        try {
          const info = await (await this.handle('output/KI-Verbindung.json')).getFile();
          if (info.size > 16384) throw new Error('Ungültige KI-Bestätigung.');
          const proof = JSON.parse(await info.text());
          const actual = normalizeAgentPath(proof.root, this.root.name);
          const expected = normalizeAgentPath(this.marker.agentRoot, this.root.name);
          const samePath = /^[a-zA-Z]:/.test(expected) ? actual.toLowerCase() === expected.toLowerCase() : actual === expected;
          if (proof.status === 'verified' && proof.workspaceId === this.marker.workspaceId && proof.libraryId === this.marker.libraryId && proof.token === this.marker.agentCheckToken && samePath && Number.isFinite(proof.verifiedAt) && proof.verifiedAt > 0) verification = proof;
        } catch (error) { if (!notFound(error) && ['NotAllowedError', 'SecurityError'].includes(error.name)) throw error; }
      }
      const changed = !!verification !== this.agentVerified;
      this.agentVerified = !!verification; this.agentVerification = verification;
      if (changed) this.report(this.status.kind, this.status.text);
      return this.agentVerified;
    }
    bindImagePaths(readable, saved) {
      const bind = (image, path) => { if (image && typeof path === 'string' && !path.split('/').some(p => !p || p === '..' || p === '.' || p.includes('\\') || p.includes(':'))) this.imagePaths.set(image, path); };
      for (const [id, item] of Object.entries(readable.assets?.backgrounds || {})) bind(saved.assets.backgrounds[id]?.src, item.srcFile);
      for (const key of ['atlas', 'fageAtlas']) bind(saved.assets[key], readable.assets?.[key + 'File']);
      for (const plan of readable.plans || []) for (const activity of plan.activities || []) bind(saved.plans.find(p => p.id === plan.id)?.activities.find(a => a.id === activity.id)?.image, activity.imageFile);
    }
    async readImage(path) {
      const suffix = path.split('.').at(-1).toLowerCase(), mime = {png: 'png', jpg: 'jpeg', jpeg: 'jpeg', webp: 'webp', gif: 'gif'}[suffix];
      if (!mime) throw new Error('Ein Bildformat wird nicht unterstützt.');
      const handle = await this.handle(path), before = await handle.getFile();
      if (before.size > MAX_BYTES) throw new Error('Eine Bilddatei ist zu gross.');
      const bytes = new Uint8Array(await before.arrayBuffer()); let binary = '';
      for (let at = 0; at < bytes.length; at += 32768) binary += String.fromCharCode(...bytes.subarray(at, at + 32768));
      if (stamp(await handle.getFile()) !== stamp(before)) throw new Error('Ein Bild wird gerade geändert.');
      return {image: 'data:image/' + mime + ';base64,' + btoa(binary), stamp: stamp(before)};
    }
    async inflateReadable(raw) {
      const data = clone(raw);
      if (!data?.assets?.backgrounds || !Array.isArray(data.plans)) throw new Error('Die Plandatei ist unvollständig.');
      for (const item of Object.values(data.assets.backgrounds)) if (item.srcFile) item.src = (await this.readImage(item.srcFile)).image;
      for (const key of ['atlas', 'fageAtlas']) if (data.assets[key + 'File']) data.assets[key] = (await this.readImage(data.assets[key + 'File'])).image;
      for (const plan of data.plans) for (const activity of plan.activities) if (activity.imageFile) activity.image = (await this.readImage(activity.imageFile)).image;
      return this.validate(data);
    }
    async compactCollection(collection) {
      const data = clone(collection);
      for (const [id, item] of Object.entries(data.assets.backgrounds)) { item.srcFile = await this.image(item.src, 'assets/backgrounds/' + id); delete item.src; }
      for (const key of ['atlas', 'fageAtlas']) if (data.assets[key]) { data.assets[key + 'File'] = await this.image(data.assets[key], 'assets/symbols/' + key); delete data.assets[key]; }
      for (const plan of data.plans) for (const activity of plan.activities) if (activity.image) { activity.imageFile = await this.image(activity.image, 'assets/activities/' + plan.id + '-' + activity.id); activity.image = ''; }
      data.workspaceAssets = true;
      return data;
    }
    async reconcileReadable(collection, incoming) {
      const source = await this.optional('data/plans.json'); if (!source) return false;
      const raw = JSON.parse(source.text);
      if (this.readableProtected || source.text !== this.lastReadable) {
        const inflated = await this.inflateReadable(raw);
        const comparable = value => ({libraryId: value.libraryId, plans: value.plans, assets: value.assets, settings: value.settings});
        // Only publish over agent edits when they exactly match the completed output.
        if (await hash(comparable(inflated)) !== await hash(comparable(incoming))) { this.readableProtected = true; return false; }
      }
      this.bindImagePaths(raw, incoming);
      this.lastReadable = source.text; this.readableProtected = false;
      return this.publishReadable(collection);
    }
    async image(image, prefix) {
      if (this.imagePaths.has(image)) {
        const known = this.imagePaths.get(image);
        try {
          const file = await (await this.handle(known)).getFile();
          if (this.imageStamps.get(known) === stamp(file)) return known;
          const actual = await this.readImage(known);
          if (actual.image === image) { this.imageStamps.set(known, actual.stamp); return known; }
        } catch (error) { if (!notFound(error)) throw error; }
        this.imagePaths.delete(image);
      }
      const match = image.match(/^data:image\/(png|jpeg|webp|gif);base64,([\s\S]+)$/);
      if (!match) throw new Error('Ein Bild konnte nicht gespeichert werden.');
      const extension = '.' + (match[1] === 'jpeg' ? 'jpg' : match[1]);
      const base = prefix.slice(0, 100) + '-' + (await hash(image)).slice(0, 20);
      let path = base + extension;
      try {
        if ((await this.readImage(path)).image !== image) path = base + '-' + crypto.randomUUID().slice(0, 8) + extension;
      } catch (error) { if (!notFound(error)) throw error; }
      const decoded = atob(match[2]), bytes = Uint8Array.from(decoded, c => c.charCodeAt(0));
      this.imageStamps.set(path, await this.write(path, bytes)); this.imagePaths.set(image, path);
      return path;
    }
    async publishReadable(collection, initial = false) {
      const existing = await this.optional('data/plans.json');
      if (!initial && (this.readableProtected || (existing?.text || null) !== this.lastReadable)) { this.readableProtected = true; return false; }
      const data = await this.compactCollection(collection);
      const text = JSON.stringify(data, null, 2);
      // Recheck after image writes, since the agent may have started editing in the meantime.
      if (!initial && (await this.optional('data/plans.json'))?.text !== this.lastReadable) { this.readableProtected = true; return false; }
      await this.write('data/plans.json', text); this.lastReadable = text; this.sync.readableHash = await hash(text);
      return true;
    }
    scheduleSave() {
      this.revision++; this.lastLocalSave = Date.now();
      if (!this.connected) return;
      this.report('writing', 'Im Speicherordner wird gesichert …');
      clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => { this.saveTimer = null; this.save().catch(error => this.fail(error)); }, 750);
    }
    async assertDiskUnchanged() {
      const disk = await (await this.handle(COLLECTION)).getFile();
      if (stamp(disk) !== this.diskStamp) throw new Error('Der Speicherordner wurde in einem anderen Browser geändert. Bitte neu verbinden.');
    }
    save() { return this.enqueue(async () => { if (!this.connected) return; await this._save(this.validate(this.options.getCollection())); }); }
    async _save(collection) {
      await this.assertDiskUnchanged();
      const revision = this.revision;
      this.diskStamp = await this.json(COLLECTION, collection);
      const published = await this.publishReadable(collection);
      await this.json(SYNC, this.sync);
      if (revision === this.revision) this.report('connected', published ? 'Im Speicherordner gesichert' : 'Gesichert · KI-Unterlagen werden gerade bearbeitet');
    }
    inspect(force = false) { return this.enqueue(() => this._inspect(force)); }
    async _inspect(force = false) {
      if (!this.connected) return;
      await this.checkAgent();
      if (this.options.isEditing() || this.saveTimer || Date.now() - this.lastLocalSave < 1500) return;
      if (!this.marker.agentRoot || !this.agentVerified) return;
      let info;
      try { info = await (await this.handle(OUTPUT)).getFile(); } catch (error) { if (notFound(error)) return; throw error; }
      if (!force && (stamp(info) === this.sync.lastOutput || stamp(info) === this.errorStamp)) return;
      const file = await this.read(OUTPUT);
      try {
        await this.assertDiskUnchanged();
        const incoming = await this.inflateReadable(JSON.parse(file.text)), revision = this.revision;
        const current = this.validate(this.options.getCollection());
        const result = await mergeCollections(current, incoming, this.sync);
        if (this.options.isEditing() || this.revision !== revision) return;
        if (result.planIds.length) {
          this.options.setImporting?.(true);
          try {
            await this.json('backups/Browser-vor-KI-' + Date.now() + '-' + crypto.randomUUID().slice(0, 8) + '.classjourney.json', current);
            if (this.options.isEditing() || this.revision !== revision) return;
            // The UI remains untouched until the file commit succeeds.
            this.diskStamp = await this.json(COLLECTION, result.collection);
            await this.options.onApply(result.collection, result);
          } finally { this.options.setImporting?.(false); }
        }
        this.sync = result.sync; this.sync.lastOutput = file.stamp; this.errorStamp = null;
        // Publish the merged collection only when the readable source contains no unfinished agent work.
        try { await this.reconcileReadable(result.collection, incoming); } catch { this.readableProtected = true; }
        await this.json(SYNC, this.sync);
        await this.json(STATUS, {status: 'applied', appliedAt: Date.now(), sourceModifiedAt: incoming.modifiedAt, added: result.added, updated: result.updated, conflicts: result.conflicts, planIds: result.planIds});
        this.report('connected', 'Im Speicherordner gesichert');
        if (result.planIds.length) this.options.onImported?.(result);
      } catch (error) {
        this.errorStamp = file.stamp;
        await this.json(STATUS, {status: 'error', checkedAt: Date.now(), error: error.message}).catch(() => {});
        throw error;
      }
    }
    fail(error) {
      if (error?.name === 'AbortError') return;
      const permission = ['NotAllowedError', 'SecurityError'].includes(error?.name);
      if (permission) { this.connected = false; clearInterval(this.timer); this.releaseLock?.(); this.releaseLock = null; this.root = null; }
      if (permission) { this.agentVerified = false; this.agentVerification = null; }
      this.report(permission ? 'permission' : 'error', permission ? 'Speicherordner: Zugriff erneut bestätigen' : error.message || 'Der Speicherordner ist momentan nicht erreichbar.');
      this.options.onError?.(error);
    }
    async disconnect({forget = true} = {}) {
      clearInterval(this.timer); clearTimeout(this.saveTimer); this.saveTimer = null;
      await this.enqueue(async () => {
        let warning;
        try { if (this.connected && this.status.kind === 'writing') await this._save(this.validate(this.options.getCollection())); }
        catch (error) { warning = error.message; }
        this.connected = false; this.root = null; this.releaseLock?.(); this.releaseLock = null;
        this.agentVerified = false; this.agentVerification = null;
        if (forget) { await this.rememberedRecord(null); this.remembered = null; }
        this.imagePaths.clear(); this.imageStamps.clear(); this.lastReadable = null; this.report('none', '');
        if (warning) this.options.onError?.(new Error(warning + ' Die Änderungen bleiben im Browser gespeichert.'));
      });
    }
  }
  globalThis.ClassJourneyBrowserWorkspace = {Workspace, mergeCollections, baseline, hash, normalizeAgentPath, prepareWorkspaceDirectory};
})();
