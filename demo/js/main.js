(function () {
    function initGame() {
        const $ = (id) => document.getElementById(id);

        const canvas = $('gameCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = 320;
        canvas.height = 360;

        // 你的游戏 JS 逻辑从这里开始

        canvas.width = 320; canvas.height = 360;
        function updateResponsiveScale() {
            const consoleEl = $('console');
            if (!consoleEl) return;

            const baseWidth = 520;
            const currentWidth = consoleEl.getBoundingClientRect().width || baseWidth;
            const scale = Math.min(1, currentWidth / baseWidth);

            consoleEl.style.setProperty('--ui-scale', scale.toFixed(4));
        }

        const ASSETS = {
            uiStartBase: './static/images/ui/start-base.png',
            uiStartFlash: './static/images/ui/start-flash.png',
            uiCharSelect: './static/images/ui/char-select-bg.png',
            consoleShell: './static/images/ui/console-shell.png',
            controlGuide: './static/images/ui/control-guide.jpg',

            floor1Normal: './static/images/scenes/floor1.jpg',
            floor2Normal: './static/images/scenes/floor2.jpg',
            kitchenNormal: './static/images/scenes/kitchen.jpg',

            cursor: './static/images/ui/cursor.png',
            nextIcon: './static/images/ui/next.png',

            invAvatarChar1: './static/images/inventory/avatar-girl.png',
            invAvatarChar2: './static/images/inventory/avatar-boy.png',

            item0Uncollected: './static/images/inventory/item0-off.png',
            item0Collected: './static/images/inventory/item0-on.png',
            item1Uncollected: './static/images/inventory/item1-off.png',
            item1Collected: './static/images/inventory/item1-on.png',
            item2Uncollected: './static/images/inventory/item2-off.png',
            item2Collected: './static/images/inventory/item2-on.png',

            summonGif: './static/images/summon/kashen.gif',
            summonShareCard: './static/images/summon/share-card.jpg'
        };

        const DIALOGUE_BG = {
            panpan: './static/images/dialogue/3.png',
            panny: './static/images/dialogue/5.png',
            popea: './static/images/dialogue/9.png',
            cooky: './static/images/dialogue/6.png',
            豆豆: './static/images/dialogue/12.png',
            coco: './static/images/dialogue/8.png',
            珍妮花: './static/images/dialogue/1.png',
            奥利维亚: './static/images/dialogue/7.png',
            乒乒: './static/images/dialogue/2.png',
            乒乒: './static/images/dialogue/4.png',
            系统: './static/images/dialogue/white.png',
            主厨: './static/images/dialogue/10.png',
            帮厨小李: './static/images/dialogue/11.png'
        };
        const playerImageSets = {
            char1: {
                up: './static/images/players/girl-front.png',
                down: './static/images/players/girl-front.png',
                left: './static/images/players/girl-left.png',
                right: './static/images/players/girl-right.png'
            },
            char2: {
                up: './static/images/players/boy-front.png',
                down: './static/images/players/boy-front.png',
                left: './static/images/players/boy-left.png',
                right: './static/images/players/boy-right.png'
            }
        };
        const state = {
            player: { x: 120, y: 320, speed: 2.5, direction: 'down' }, keys: { up: false, down: false, left: false, right: false }, scene: 1,
            isDialogue: false, isTransitioning: false, hasGameStarted: false, isLoaded: false, currentTarget: null,
            isSelectingChar: false, selectedChar: 'char1', isInventoryOpen: false, inventory: [false, false, false],
            isSummonScreenOpen: false, isSummonEndingOpen: false,
            isControlGuideOpen: false, hasControlGuideShown: false
        };

        const PLAYER_BOUNDS = { 1: { minX: 30, maxX: 290, minY: 170, maxY: 350 }, 2: { minX: 20, maxX: 300, minY: 180, maxY: 300 }, 3: { minX: 20, maxX: 280, minY: 185, maxY: 350 } };
        const OBSTACLES = {
            1: [{ x: 80, y: 100, w: 170, h: 70 }, { x: 60, y: 180, w: 20, h: 30 }, { x: 20, y: 250, w: 30, h: 30 }, { x: 40, y: 320, w: 30, h: 30 }, { x: 140, y: 280, w: 50, h: 50 }, { x: 220, y: 300, w: 60, h: 30 }, { x: 290, y: 230, w: 20, h: 50 }, { x: 200, y: 200, w: 40, h: 40 }],
            2: [{ x: 130, y: 210, w: 100, h: 50 }],
            3: [{ x: 155, y: 310, w: 120, h: 40 }/*横桌子*/, { x: 80, y: 270, w: 70, h: 100 }/*面包panpan桌子*/, { x: 260, y: 250, w: 20, h: 30 }/*路牌*/, { x: 90, y: 250, w: 35, h: 20 }/*面包潘潘*/, { x: 100, y: 185, w: 20, h: 30 }/*猫*/, { x: 180, y: 270, w: 40, h: 40 }/*可颂潘潘*/, { x: 40, y: 170, w: 60, h: 60 }/*panny桌子*/]
        };
        const SHOW_OBSTACLES_DEBUG = false;

        let orders = []; let isTyping = false; let typingTimer = null; let pages = ['']; let pageIndex = 0; let currentPageText = ''; let currentChoices = []; let currentChoiceIndex = 0; let isChoiceMode = false; let currentNodeId = ''; let currentNextNode = null;
        let summonUserName = ''; let summonEndingChoiceIndex = 0; let summonEndingStep = 'name'; let summonSharePosterDataUrl = '';
        let inventoryGainMessage = '';
        let gameStartTimestamp = 0;
        const GAME_TIMER_LIMIT_MS = 20 * 60 * 1000;
        const SUMMON_ENDING_CONFIG = {
            shareNameTextPrefix: '',
            shareNameTextSuffix: '',
            shareNameXRatio: 0.2,
            shareNameYRatio: 0.12,
            shareNameMaxWidthRatio: 0.78,
            shareTimeXRatio: 0.2,
            shareTimeYRatio: 0.18,
            shareTimeMaxWidthRatio: 0.78
        };

        // 随机壁纸池：weight 越大，被抽中的概率越高。
        // 概率计算方式：单张概率 = 当前 weight / 所有 weight 之和。
        // 把 url 替换成你的壁纸 Shopify CDN 链接即可。
        const WALLPAPER_POOL = [
            { url: './static/images/wallpapers/01.png', weight: 10 },
            { url: './static/images/wallpapers/02.png', weight: 10 },
            { url: './static/images/wallpapers/03.png', weight: 10 },
        ];

        const storyData = {
            "panpan_start": { name: "panpan", text: "Hi! 欢迎光临～我是店长panpan！\n想喝咖啡可以去吧台点餐\n [按A继续] | 二楼可以从右上角的楼梯上去。\n厨房在左上角，欢迎去参观哦！\n [按B结束]", choices: null },
            "panny_start": {
                name: "panny", text: "你好呀～我是panny，正在给蛋糕裱花。\n[按A继续]", choices: [{ text: "今天的可颂看着不错呢", next: "panny_croissant", action: () => orders.push("扁扁可颂") }, { text: "请给我一份布丁！", next: "panny_pudding", action: () => orders.push("焦糖布丁") }]
            },
            "panny_croissant": { name: "panny", text: "Coco昨晚梦到了扁扁可颂！\n扁可颂就是要像这样压的扁扁的！| 你可以去大厅找个空座位坐下，\n稍后Coco会帮你送过去的～ \n[按B结束]", choices: null },
            "panny_pudding": { name: "panny", text: "好的！你可以去大厅先找个空座位坐下，稍后Coco会帮你送过去的～ \n[按B结束]", choices: null },
            "popea_start": { name: "popea", text: "我是popea，今天想喝点什么呢？\n虽然我没有在咖啡节获得名次，但收到了伙伴们为我准备的奖杯，真的特别感动。\n[按A继续]|我们有许多优质的豆子，都是Cooky从森林中带来的\n[按A继续]|想喝什么口味的豆子？去右边告诉豆豆吧！\n[按B结束]", choices: null },
            "cooky_start": { name: "cooky", text: "我是cooky，今天的咖啡豆怎么样？\n都是刚刚从森林里带回来的哦。\n[按B结束]", choices: null },
            "doudou_start": { name: "豆豆", text: "我是豆豆，这就帮你磨豆豆！\n你需要什么风味的？\n[按A继续]", choices: [{ text: "我想试试花果香味的浅烘", next: "doudou_light", action: () => orders.push("浅烘咖啡") }, { text: "来一份榛果风味的中烘", next: "doudou_medium", action: () => orders.push("中烘咖啡") }, { text: "就选浓郁巧克力的深烘", next: "doudou_dark", action: () => orders.push("深烘咖啡") }] },
            "doudou_light": { name: "豆豆", text: "浅烘豆子需要像细砂糖细腻哦。\n你可以先找个空座位坐一会～\n[按B结束]", choices: null },
            "doudou_medium": { name: "豆豆", text: "中烘的豆子，中等研磨度～\n你可以先找个空座位坐一会～\n[按B结束]", choices: null },
            "doudou_dark": { name: "豆豆", text: "深烘豆需要像海盐般的颗粒呢。\n你可以先找个空座位坐一会～\n[按B结束]", choices: null },
            "coco_wait": { name: "coco", text: "hello，我是服务员coco。\n稍后帮你把餐品送过去。\n[按B结束]", choices: null },
            "seat_empty": { name: "系统", text: "这是一张空桌子。你还没有点任何东西，先去吧台找店员点餐吧！[按B结束]", choices: null },
            "seat_sit": { name: "系统", text: "你拉开椅子坐了下来。", choices: [{ text: "耐心等待...", next: "coco_serve" }] },
            "coco_serve": { name: "coco", text: "（动态生成的文字，会被替换）", choices: [{ text: "不错不错", next: "coco_good" }, { text: "一般般吧", next: "coco_bad" }] },
            "coco_good": { name: "coco", text: "对吧！我也觉得餐品超棒的！\n恭喜你成为了我们今天的幸运客人！\n[按A继续]|送你一个珍妮花纸杯蛋糕！希望你会喜欢！\n[按B结束]", choices: null },
            "coco_bad": { name: "coco", text: "诶？一定是哪个环节出问题了... \n这样子好了，我偷偷的送给你一份小礼物（珍妮花纸杯蛋糕）吧，希望下次您再来的时候会有更好的体验！\n[按B结束]", choices: null },
            "pangpang_start": { name: "乓乓", text: "啊！是乓乓！被困在果冻里了\n[按A继续]", choices: [{ text: "把他救出来！", next: "pangpang_save" }, { text: "还是不管了！", next: "pangpang_ignore" }] },
            "pangpang_save": { name: "乓乓", text: "唔，我..我其实是在..帮忙的\n谢谢你，这份果冻送给你吃好了！\n[按B结束]", choices: null },
            "pangpang_ignore": { name: "系统", text: "你默默地走开了...\n乓乓继续在果冻里挣扎...\n[按B结束]", choices: null },
            "pingping_start": { name: "乒乒", text: "啊啊啊！谁来救一下乓乓啊！！！\n[按B结束]", choices: null },
            "guest_start": { name: "珍妮花", text: "你好，这阳台的风景真好。\n请问.. 方便帮我拍一张照片吗？\n [按A继续]", choices: [{ text: "没问题！交给我吧", next: "guest_yes" }, { text: "可是我不是很会拍照耶", next: "guest_no" }] },
            "guest_yes": { name: "珍妮花", text: "（咔嚓）\n哇塞，谢谢你！拍的超棒的！\n[按B结束]", choices: null },
            "guest_no": { name: "珍妮花", text: "没关系，我会教你操作的！\n（咔嚓）哇塞，拍的超棒的！\n[按B结束]", choices: null },
            "oliver_start": { name: "奥利维亚", text: "（咔嚓）你好呀，这里真不错，对吧？[按B结束]", choices: null },
            "chef_start": { name: "主厨", text: "哎呀，你怎么来厨房了！\n我刚给扁可颂涂完黄油呢\n[按B结束]", choices: null },
            "helper_start": {
                name: "帮厨Coco", text: "最近我们新进了一批豆子，\n你可以帮忙拿给豆豆吗？\n[按A继续]", choices: [{ text: "在面包架上吗？", next: "helper_sad" }, { text: "在洗水槽上吗？", next: "helper_happy" }, { text: "在桌子上吗？", next: "helper_desk" }]
            },
            "helper_happy": { name: "帮厨Coco", text: "对！麻烦啦~\n[按B结束]", choices: null },
            "helper_sad": { name: "帮厨Coco", text: "不是哦，再找找！\n[按B结束]", choices: null },
            "helper_desk": { name: "帮厨Coco", text: "不是哦，再找找！\n[按B结束]", choices: null },
            "lucy_start": {
                name: "lucy",
                text: "喵~\n[按B结束]",
                choices: null
            },
            "find_item_0": {
                name: "系统", text: "你发现吧台上有小撮深色的东西，\n散发着淡淡的香味，靠近看看？",
                choices: [
                    { text: "走！去问问Popea这是什么！", action: () => { state.inventory[0] = true; openInventory(); $('inv-text-0').innerText = '咖啡渣'; }, next: "none" },
                    { text: "不要了吧...", next: "leave_item" }
                ]
            },
            "find_item_1": {
                name: "系统", text: "诶？是什么味道？\n桌上飘来了一股温热的咖啡香。",
                choices: [
                    { text: "是焦糖和坚果的味道。", action: () => { state.inventory[1] = true; openInventory(); $('inv-text-1').innerText = '咖啡的香气'; }, next: "none" },
                    { text: "等PinPin收拾桌子吧！", next: "leave_item" }
                ]
            },
            "find_item_2": {
                name: "系统", text: "这是他们要用的咖啡豆吗？",
                choices: [
                    { text: "那给DoDo吧！", action: () => { state.inventory[2] = true; openInventory(); $('inv-text-2').innerText = '咖啡豆'; }, next: "none" },
                    { text: "还是再问问吧...", next: "leave_item" }
                ]
            },
            "leave_item": { name: "系统", text: "你决定不去管它。\n[按B结束]", choices: null },
            "summon_god_dialogue_1": {
                name: "系统",
                text: "黑暗里，那些置于角落的咖啡渣，\n忽然泛起微弱的光。\n[按A继续]",
                choices: null,
                next: "summon_god_dialogue_2"
            },
            "summon_god_dialogue_2": {
                name: "系统",
                text: "它们不是普通的残渣。\n它们来自成千上万次练习：\n研磨、冲煮、失败、重来。",
                choices: null,
                next: "summon_god_dialogue_3"
            },
            "summon_god_dialogue_3": {
                name: "系统",
                text: "每一次认真制作咖啡的心意，\n当这份期许足够强大，\n它便在香气与热气中凝练成形。",
                choices: null,
                next: "summon_god_dialogue_4"
            },
            "summon_god_dialogue_4": {
                name: "咖神",
                text: "我是咖神。\n我诞生于咖啡渣，\n也诞生于咖啡人不肯停下的双手。",
                choices: null,
                next: "summon_god_dialogue_5"
            },
            "summon_god_dialogue_5": {
                name: "咖神",
                text: "让咖啡拥有灵魂的，不只是配方。\n而是一次次练习之后，\n仍然相信下一杯会更好。",
                choices: null,
                next: "summon_god_dialogue_6"
            },
            "summon_god_dialogue_6": {
                name: "咖神",
                text: "是谁唤醒了我？\n[按B结束]",
                choices: null
            }
        };

        const npcs = [
            { id: 0, name: "panpan", x: 160, y: 335, hidden: true, emoji: "🐻", node: "panpan_start", scene: 1 },
            { id: 2, name: "popea", x: 100, y: 180, hidden: true, emoji: "☕", node: "popea_start", scene: 1 },
            { id: 3, name: "cooky", x: 200, y: 240, hidden: true, emoji: "🥤", node: "cooky_start", scene: 1 },
            { id: 4, name: "豆豆", x: 200, y: 180, hidden: true, emoji: "🤎", node: "doudou_start", scene: 1 },
            { id: 5, name: "coco", x: 60, y: 200, hidden: true, emoji: "💁", node: "coco_wait", scene: 1 },
            { id: 8, name: "座位", x: 80, y: 340, hidden: true, emoji: "🪑", node: "seat", scene: 1 },
            { id: 9, name: "座位", x: 245, y: 340, hidden: true, emoji: "🪑", node: "seat", scene: 1 },
            { id: 7, name: "珍妮花", x: 140, y: 230, hidden: true, emoji: "📸", node: "guest_start", scene: 2 },
            { id: 11, name: "奥利维亚", x: 220, y: 230, hidden: true, emoji: "📸", node: "oliver_start", scene: 2 },
            { id: 6, name: "乓乓", x: 35, y: 280, hidden: true, emoji: "🍮", node: "pangpang_start", scene: 1 },
            { id: 10, name: "乒乒", x: 160, y: 240, img: "https://cdn.shopify.com/s/files/1/0651/5186/0943/files/c063ffe11fbded9f4e12b59983d5b045.png?v=1776071486", node: "pingping_start", scene: 1, dx: 1.5, dy: 1.2 },
            { id: 1, name: "panny", x: 80, y: 220, hidden: true, emoji: "🍰", node: "panny_start", scene: 3 },
            { id: 12, name: "主厨", x: 115, y: 270, hidden: true, emoji: "👨‍🍳", node: "chef_start", scene: 3 },
            { id: 13, name: "帮厨小李", x: 190, y: 290, hidden: true, emoji: "🧑", node: "helper_start", scene: 3 },
            { id: 20, name: "未知物品1", x: 145, y: 180, hidden: true, emoji: "✨", node: "find_item_0", scene: 1 },
            { id: 21, name: "未知物品2", x: 80, y: 180, hidden: true, emoji: "✨", node: "find_item_1", scene: 2 },
            { id: 22, name: "未知物品3", x: 130, y: 160, hidden: true, emoji: "✨", node: "find_item_2", scene: 3 },
            { id: 14, name: "lucy", x: 115, y: 220, hidden: true, emoji: "👧", node: "lucy_start", scene: 3 },
        ];

        const playerImages = { char1: {}, char2: {} };
        const npcImages = {};

        function loadImage(src) {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => resolve(img);
                img.src = src;
            });
        }

        function preloadAllImages() {
            const tasks = [];
            Object.values(ASSETS).forEach(src => tasks.push(loadImage(src)));
            Object.values(DIALOGUE_BG).forEach(src => tasks.push(loadImage(src)));
            Object.entries(playerImageSets).forEach(([charKey, urls]) => {
                Object.entries(urls).forEach(([dir, src]) => {
                    tasks.push(loadImage(src).then(img => playerImages[charKey][dir] = img));
                });
            });
            npcs.forEach(npc => {
                if (npc.img) tasks.push(loadImage(npc.img).then(img => npcImages[npc.id] = img));
            });
            WALLPAPER_POOL.forEach(item => {
                if (item.url) tasks.push(loadImage(item.url));
            });
            return Promise.all(tasks);
        }

        function initStaticImages() {
            $('start-image-base').src = ASSETS.uiStartBase;
            $('console-shell').src = ASSETS.consoleShell;
            $('scene-bg').src = ASSETS.floor1Normal;
            if ($('control-guide-img')) $('control-guide-img').src = ASSETS.controlGuide;
            $('char-select-bg').src = ASSETS.uiCharSelect;
            $('start-image-flash').src = ASSETS.uiStartFlash;
            $('preview-char1').src = playerImageSets.char1.down;
            $('preview-char2').src = playerImageSets.char2.down;
            $('inv-item-0').src = ASSETS.item0Uncollected;
            $('inv-item-1').src = ASSETS.item1Uncollected;
            $('inv-item-2').src = ASSETS.item2Uncollected;
            // 设置 GIF
            $('summon-gif-img').src = ASSETS.summonGif;
            if ($('summon-share-card-img')) $('summon-share-card-img').src = ASSETS.summonShareCard;
            if ($('summon-wallpaper-img') && WALLPAPER_POOL.length) $('summon-wallpaper-img').src = WALLPAPER_POOL[0].url;
            if ($('summon-wallpaper-name') && WALLPAPER_POOL.length) $('summon-wallpaper-name').innerText = WALLPAPER_POOL[0].name;
        }

        function playBgm() { const bgm = $('bgm'); if (!bgm) return; bgm.volume = 0.5; const promise = bgm.play(); if (promise) promise.catch(() => { }); }

        function updateSceneBg(sceneId) {
            if (sceneId === 1) $('scene-bg').src = ASSETS.floor1Normal;
            else if (sceneId === 2) $('scene-bg').src = ASSETS.floor2Normal;
            else if (sceneId === 3) $('scene-bg').src = ASSETS.kitchenNormal;
        }

        function toggleDarkMask(show) {
            if (show) $('dark-mask').classList.remove('hide');
            else $('dark-mask').classList.add('hide');
        }

        function switchScene(scene, x, y) {
            if (state.isTransitioning) return;
            state.isTransitioning = true; $('transition-overlay').style.opacity = 1;
            setTimeout(() => {
                state.scene = scene; state.player.x = x; state.player.y = y;
                updateSceneBg(scene);
                $('transition-overlay').style.opacity = 0;
                setTimeout(() => state.isTransitioning = false, 500);
            }, 500);
        }

        function checkCollision(targetX, targetY, scene) {
            const bounds = PLAYER_BOUNDS[scene];
            if (bounds) { if (targetX < bounds.minX || targetX > bounds.maxX || targetY < bounds.minY || targetY > bounds.maxY) return true; }
            const obstacles = OBSTACLES[scene] || [];
            const hitbox = { left: targetX - 12, right: targetX + 12, top: targetY - 15, bottom: targetY };
            for (let obs of obstacles) {
                const obsBox = { left: obs.x, right: obs.x + obs.w, top: obs.y, bottom: obs.y + obs.h };
                if (!(hitbox.left >= obsBox.right || hitbox.right <= obsBox.left || hitbox.top >= obsBox.bottom || hitbox.bottom <= obsBox.top)) return true;
            }
            return false;
        }

        function movePlayer() {
            const p = state.player; let dx = 0, dy = 0;
            if (state.keys.up) dy -= p.speed; if (state.keys.down) dy += p.speed; if (state.keys.left) dx -= p.speed; if (state.keys.right) dx += p.speed;
            if (dx !== 0 || dy !== 0) {
                let nextX = p.x + dx; let nextY = p.y + dy;
                if (!checkCollision(nextX, p.y, state.scene)) p.x = nextX;
                if (!checkCollision(p.x, nextY, state.scene)) p.y = nextY;
            }
        }

        function moveRoamingNpcs() {
            npcs.forEach(npc => {
                if (npc.dx === undefined || npc.scene !== state.scene) return;
                let minX = 0, maxX = 300, minY = 50, maxY = 300;
                let nextX = npc.x + npc.dx;
                let nextY = npc.y + npc.dy;
                if (nextX < minX || nextX > maxX || checkCollision(nextX, npc.y, npc.scene)) {
                    npc.dx *= -1;
                    npc.dy += (Math.random() - 0.5) * 0.5;
                } else {
                    npc.x = nextX;
                }
                if (nextY < minY || nextY > maxY || checkCollision(npc.x, nextY, npc.scene)) {
                    npc.dy *= -1;
                    npc.dx += (Math.random() - 0.5) * 0.5;
                } else {
                    npc.y = nextY;
                }
                const maxSpeed = 3;
                npc.dx = Math.max(-maxSpeed, Math.min(maxSpeed, npc.dx));
                npc.dy = Math.max(-maxSpeed, Math.min(maxSpeed, npc.dy));
            });
        }

        function gameLoop() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (state.scene === 1 && !state.isTransitioning && Math.hypot(state.player.x - 280, state.player.y - 190) < 25) { switchScene(2, 46, 270); }
            if (state.scene === 2 && !state.isTransitioning && Math.hypot(state.player.x - 20, state.player.y - 270) < 25) { switchScene(1, 280, 220); }
            if (state.scene === 1 && !state.isTransitioning && Math.hypot(state.player.x - 20, state.player.y - 220) < 25) { switchScene(3, 250, 250); }
            if (state.scene === 3 && !state.isTransitioning && Math.hypot(state.player.x - 280, state.player.y - 250) < 25) { switchScene(1, 72, 270); }
            if (!state.isDialogue && !state.isTransitioning && !state.isInventoryOpen && !state.isSummonScreenOpen && !state.isSummonEndingOpen && !state.isControlGuideOpen) { movePlayer(); moveRoamingNpcs(); }
            if (SHOW_OBSTACLES_DEBUG) {
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)'; ctx.lineWidth = 1; const currentObstacles = OBSTACLES[state.scene] || [];
                for (let obs of currentObstacles) { ctx.strokeRect(obs.x, obs.y, obs.w, obs.h); }
                ctx.strokeStyle = 'rgba(0, 0, 255, 0.6)'; ctx.strokeRect(state.player.x - 12, state.player.y - 15, 24, 15);
            }
            drawNpcs(); drawPlayer(); requestAnimationFrame(gameLoop);
        }

        function drawNpcs() {
            state.currentTarget = null;
            npcs.filter(npc => npc.scene === state.scene).forEach(npc => {
                const img = npcImages[npc.id];
                if (img && img.complete) { ctx.drawImage(img, npc.x - 16, npc.y - 32, 32, 35); } else if (!npc.hidden && npc.emoji) { ctx.font = '24px PixelFont'; ctx.fillText(npc.emoji, npc.x - 12, npc.y); }
                const near = Math.hypot(npc.x - state.player.x, npc.y - state.player.y) < 35;
                if (near) {
                    if (npc.id === 20 && state.inventory[0]) return;
                    if (npc.id === 21 && state.inventory[1]) return;
                    if (npc.id === 22 && state.inventory[2]) return;
                    state.currentTarget = npc;
                    if (!state.isDialogue && !state.isTransitioning && !state.isInventoryOpen && !state.isSummonScreenOpen) { ctx.fillStyle = '#f3e5ab'; ctx.font = 'bold 9px PixelFont'; ctx.textAlign = 'center'; ctx.fillText('[按 A 交互]', npc.x, npc.y - 35); ctx.textAlign = 'left'; }
                }
            });
        }

        function drawPlayer() {
            if (state.isTransitioning) return;
            const img = playerImages[state.selectedChar][state.player.direction];
            if (img && img.complete) {
                const w = 70; const h = 70;
                ctx.drawImage(img, state.player.x - w / 2, state.player.y - h, w, h);
            } else { ctx.font = '24px PixelFont'; ctx.fillText('🚶', state.player.x - 12, state.player.y); }
        }

        function tryInteract() {
            if (!state.hasGameStarted || state.isDialogue || state.isTransitioning || state.isInventoryOpen || state.isSummonScreenOpen || state.isSummonEndingOpen || state.isControlGuideOpen) return;
            const target = state.currentTarget; if (!target) return;
            if (target.emoji === '🪑') { if (orders.length > 0) { state.player.x = target.x; state.player.y = target.y - 25; openNode('seat_sit', '系统'); } else { openNode('seat_empty', '系统'); } return; }
            openNode(target.node, target.name);
        }

        function setDialogueTheme(name) { $('dialogue-bg').src = DIALOGUE_BG[name] || DIALOGUE_BG['系统']; }

        function splitText(text, limit = 55) {
            const raw = String(text || '').trim(); if (!raw) return ['']; const result = []; const manualChunks = raw.split('|');
            manualChunks.forEach(chunk => {
                let page = ''; function push() { if (page.trim()) result.push(page.trim()); page = ''; }
                function add(piece) { while (piece.length) { const room = limit - page.length; if (room <= 0) { push(); continue; } if (piece.length <= room) { page += piece; break; } let cut = room; const from = Math.max(0, Math.floor(room * 0.55)); const mark = piece.slice(from, room + 1).search(/[，。！？、~～…,.!?]/); if (mark !== -1) cut = from + mark + 1; page += piece.slice(0, cut); piece = piece.slice(cut); push(); } }
                chunk.split('\n').forEach((line, i, arr) => { add(line); if (i < arr.length - 1) { page.length + 1 >= limit ? push() : page += '\n'; } }); push();
            }); return result.length ? result : [''];
        }

        function openNode(nodeId, fallbackName = '') {
            const node = storyData[nodeId];
            if (!node) return;

            currentNodeId = nodeId;
            currentNextNode = node.next || null;

            const speaker = node.name || fallbackName;
            let text = node.text;
            if (nodeId === 'coco_serve') {
                const items = Array.from(new Set(orders)).join(' 和 ');
                text = `halo，这里是coco。你点的『${items}』送来啦！感觉餐品还满意吗？`;
                orders = [];
            }
            state.isDialogue = true;
            $('dialogue-container').classList.remove('hide');
            $('name-tag').innerText = speaker;
            setDialogueTheme(speaker);
            toggleDarkMask(true);
            pages = splitText(text);
            pageIndex = 0;
            currentChoices = Array.isArray(node.choices) ? node.choices : [];
            currentChoiceIndex = 0;
            typePage(35);
        }

        function typePage(speed = 35) {
            clearTyping(); const container = $('dialogue-container'); const message = $('message-text'); container.classList.remove('is-choice-page'); message.classList.remove('page-changing'); message.innerText = ''; $('choices-box').innerHTML = '';
            currentPageText = pages[pageIndex] || ''; isTyping = true; isChoiceMode = false; updatePageIcon(true);
            let i = 0; typingTimer = setInterval(() => { message.innerText += currentPageText[i] || ''; i++; if (i >= currentPageText.length) { clearTyping(); isTyping = false; updatePageIcon(false); } }, speed);
        }

        function clearTyping() { if (typingTimer) { clearInterval(typingTimer); typingTimer = null; } }
        function finishTyping() { if (!isTyping) return; clearTyping(); isTyping = false; $('message-text').innerText = currentPageText; updatePageIcon(false); }

        function updatePageIcon(forceHide = false) {
            const icon = $('page-next-icon');
            icon.src = ASSETS.nextIcon;
            const hasNextTextPage = pageIndex < pages.length - 1;
            const isLastTextPage = pageIndex === pages.length - 1;
            const hasChoicePage = currentChoices.length > 0 && isLastTextPage;
            const hasNextNode = !!currentNextNode && isLastTextPage;
            const hasSummonNameInput = currentNodeId === 'summon_god_dialogue_6' && isLastTextPage;
            const shouldShow = (!forceHide && state.isDialogue && !isTyping && !isChoiceMode && (hasNextTextPage || hasChoicePage || hasNextNode || hasSummonNameInput));
            icon.classList.toggle('hide', !shouldShow);
        }

        function nextDialoguePage() {
            if (!state.isDialogue || isChoiceMode) return;
            if (isTyping) return finishTyping();

            // 当前节点最后一页之后，如果有选项，按 A 进入选项页
            if (currentChoices.length > 0 && pageIndex === pages.length - 1) {
                openChoicePage();
                return;
            }

            // 普通多页文本：按 A 进入下一页，不再循环回第一页
            if (pageIndex < pages.length - 1) {
                const message = $('message-text');
                message.classList.add('page-changing');
                updatePageIcon(true);
                setTimeout(() => {
                    pageIndex += 1;
                    typePage(25);
                }, 120);
                return;
            }

            // 咖神最后一句：按 A 不关闭对话，而是进入昵称输入界面
            if (currentNodeId === 'summon_god_dialogue_6' && pageIndex === pages.length - 1) {
                openSummonNameInput();
                return;
            }

            // 支持 storyData 中的 next 字段：咖神对话就是靠这里从第 1 句跳到第 2 句
            if (currentNextNode) {
                const nextNode = currentNextNode;
                currentNextNode = null;
                openNode(nextNode, '');
            }
        }

        function openChoicePage() { isChoiceMode = true; updatePageIcon(true); $('dialogue-container').classList.add('is-choice-page'); renderChoices(); }

        function renderChoices() {
            const box = $('choices-box'); box.innerHTML = ''; currentChoices.forEach((choice, index) => {
                const row = document.createElement('div'); const cursor = document.createElement('img'); const text = document.createElement('div');
                row.className = 'choice-row'; cursor.className = 'choice-cursor'; cursor.src = ASSETS.cursor; cursor.style.visibility = index === currentChoiceIndex ? 'visible' : 'hidden'; text.className = 'choice-text'; text.innerText = choice.text;
                row.append(cursor, text); box.appendChild(row);
            });
        }

        function moveChoice(direction) { if (!isChoiceMode || !currentChoices.length) return; currentChoiceIndex += direction === 'up' ? -1 : 1; if (currentChoiceIndex < 0) currentChoiceIndex = currentChoices.length - 1; if (currentChoiceIndex >= currentChoices.length) currentChoiceIndex = 0; renderChoices(); }

        function confirmChoice() {
            if (!isChoiceMode || !currentChoices.length) return;
            const choice = currentChoices[currentChoiceIndex];
            isChoiceMode = false; $('dialogue-container').classList.remove('is-choice-page');
            if (choice.action) choice.action();
            if (choice.next !== 'none') openNode(choice.next, '');
        }


        function hideDialogueOnly() {
            clearTyping();
            state.isDialogue = false;
            isTyping = false;
            isChoiceMode = false;
            pages = [''];
            pageIndex = 0;
            currentChoices = [];
            currentChoiceIndex = 0;
            currentNodeId = '';
            currentNextNode = null;
            $('dialogue-container').classList.add('hide');
            $('dialogue-container').classList.remove('is-choice-page');
            $('choices-box').innerHTML = '';
            $('message-text').innerText = '';
            $('page-next-icon').classList.add('hide');
            state.keys = { up: false, down: false, left: false, right: false };
        }

        function showSummonEndingPanel(panelId) {
            ['summon-name-panel', 'summon-choice-panel', 'summon-share-panel', 'summon-wallpaper-panel'].forEach(id => {
                const el = $(id);
                if (el) el.classList.toggle('hide', id !== panelId);
            });
        }

        function openSummonNameInput() {
            hideDialogueOnly();
            state.isSummonEndingOpen = true;
            summonEndingStep = 'name';
            summonEndingChoiceIndex = 0;
            $('summon-ending-screen').classList.remove('hide');
            showSummonEndingPanel('summon-name-panel');
            const input = $('summon-name-input');
            if (input) {
                input.value = summonUserName || '';
                setTimeout(() => input.focus(), 60);
            }
        }


        function startGameTimer() {
            if (!gameStartTimestamp) gameStartTimestamp = Date.now();
        }

        function getGameElapsedText() {
            if (!gameStartTimestamp) return '';
            const elapsedMs = Date.now() - gameStartTimestamp;
            if (elapsedMs < 0 || elapsedMs > GAME_TIMER_LIMIT_MS) return '';
            const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            if (minutes <= 0) return `用时 ${seconds}秒`;
            return `用时 ${minutes}分${String(seconds).padStart(2, '0')}秒`;
        }

        function loadCanvasImage(src) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                // if (/^https?:/i.test(src)) img.crossOrigin = 'anonymous';
                img.onload = () => resolve(img);
                img.onerror = (err) => reject(err || new Error('image load error'));
                img.src = src;
            });
        }

        async function renderSummonSharePoster() {
            const outputImg = $('summon-share-card-img');
            const fallbackName = $('summon-share-name');
            const timeLabel = $('summon-share-time-label');
            const nameText = `${SUMMON_ENDING_CONFIG.shareNameTextPrefix}${summonUserName || '神秘咖啡人'}${SUMMON_ENDING_CONFIG.shareNameTextSuffix}`;
            const elapsedText = getGameElapsedText();
            summonSharePosterDataUrl = '';

            if (fallbackName) {
                fallbackName.classList.add('hide');
                fallbackName.innerText = '';
            }
            if (timeLabel) {
                if (elapsedText) {
                    timeLabel.innerText = elapsedText;
                    timeLabel.classList.remove('hide');
                } else {
                    timeLabel.innerText = '';
                    timeLabel.classList.add('hide');
                }
            }
            if (outputImg) {
                outputImg.src = ASSETS.summonShareCard;
            }

            try {
                const baseImg = await loadCanvasImage(ASSETS.summonShareCard);
                const canvas = document.createElement('canvas');
                const width = baseImg.naturalWidth || baseImg.width || 1000;
                const height = baseImg.naturalHeight || baseImg.height || 1400;
                canvas.width = width;
                canvas.height = height;
                const ctx2 = canvas.getContext('2d');

                ctx2.drawImage(baseImg, 0, 0, width, height);

                const nameX = width * SUMMON_ENDING_CONFIG.shareNameXRatio;
                const nameY = height * SUMMON_ENDING_CONFIG.shareNameYRatio;
                const nameMaxWidth = width * SUMMON_ENDING_CONFIG.shareNameMaxWidthRatio;
                let fontSize = Math.round(width * 0.065);
                const minFontSize = Math.max(26, Math.round(width * 0.035));

                ctx2.textAlign = 'center';
                ctx2.textBaseline = 'middle';
                ctx2.lineJoin = 'round';
                ctx2.lineCap = 'round';

                do {
                    ctx2.font = `bold ${fontSize}px PixelFont, sans-serif`;
                    if (ctx2.measureText(nameText).width <= nameMaxWidth || fontSize <= minFontSize) break;
                    fontSize -= 2;
                } while (fontSize > minFontSize);

                ctx2.strokeStyle = 'rgba(255,255,255,0.92)';
                ctx2.lineWidth = Math.max(6, Math.round(fontSize * 0.18));
                ctx2.fillStyle = '#4a2e1b';
                ctx2.strokeText(nameText, nameX, nameY);
                ctx2.fillText(nameText, nameX, nameY);

                if (elapsedText) {
                    const timeX = width * SUMMON_ENDING_CONFIG.shareTimeXRatio;
                    const timeY = height * SUMMON_ENDING_CONFIG.shareTimeYRatio;
                    const timeMaxWidth = width * SUMMON_ENDING_CONFIG.shareTimeMaxWidthRatio;
                    let timeFontSize = Math.round(width * 0.04);
                    const timeMinFontSize = Math.max(18, Math.round(width * 0.025));
                    do {
                        ctx2.font = `bold ${timeFontSize}px PixelFont, sans-serif`;
                        if (ctx2.measureText(elapsedText).width <= timeMaxWidth || timeFontSize <= timeMinFontSize) break;
                        timeFontSize -= 2;
                    } while (timeFontSize > timeMinFontSize);

                    ctx2.strokeStyle = 'rgba(255,255,255,0.9)';
                    ctx2.lineWidth = Math.max(4, Math.round(timeFontSize * 0.16));
                    ctx2.fillStyle = '#8b4513';
                    ctx2.strokeText(elapsedText, timeX, timeY);
                    ctx2.fillText(elapsedText, timeX, timeY);
                }

                summonSharePosterDataUrl = canvas.toDataURL('image/png');
                if (outputImg) outputImg.src = summonSharePosterDataUrl;
            } catch (err) {
                console.warn('生成分享海报失败，回退到文字覆盖方式', err);
                if (fallbackName) {
                    const fallbackText = elapsedText ? `${nameText}\n${elapsedText}` : nameText;
                    fallbackName.innerText = fallbackText;
                    fallbackName.classList.remove('hide');
                }
            }
        }

        function confirmSummonName() {
            const input = $('summon-name-input');
            const value = input ? input.value.trim() : '';
            summonUserName = value || '神秘咖啡人';
            summonEndingStep = 'menu';
            summonEndingChoiceIndex = 0;
            const nameBox = $('summon-choice-name');
            if (nameBox) nameBox.innerText = `「${summonUserName}」唤醒了咖神。`;
            showSummonEndingPanel('summon-choice-panel');
            renderSummonEndingChoices();
        }

        function renderSummonEndingChoices() {
            document.querySelectorAll('.summon-ending-choice').forEach((btn, index) => {
                btn.classList.toggle('selected', index === summonEndingChoiceIndex);
            });
        }

        function moveSummonEndingChoice(direction) {
            if (!state.isSummonEndingOpen || summonEndingStep !== 'menu') return;
            if (direction === 'left') summonEndingChoiceIndex = 0;
            if (direction === 'right') summonEndingChoiceIndex = 1;
            renderSummonEndingChoices();
        }

        function confirmSummonEndingAction() {
            if (!state.isSummonEndingOpen) return;
            if (summonEndingStep === 'name') {
                confirmSummonName();
                return;
            }
            if (summonEndingStep === 'menu') {
                if (summonEndingChoiceIndex === 0) openSummonShareCard();
                else openSummonWallpaperCard();
            }
        }

        async function openSummonShareCard() {
            summonEndingStep = 'share';
            showSummonEndingPanel('summon-share-panel');
            await renderSummonSharePoster();
        }

        function pickWeightedWallpaper() {
            const validPool = WALLPAPER_POOL.filter(item => item && item.url && Number(item.weight) > 0);
            if (!validPool.length) return null;

            const totalWeight = validPool.reduce((sum, item) => sum + Number(item.weight), 0);
            let randomValue = Math.random() * totalWeight;

            for (const item of validPool) {
                randomValue -= Number(item.weight);
                if (randomValue <= 0) return item;
            }
            return validPool[validPool.length - 1];
        }

        function openSummonWallpaperCard() {
            summonEndingStep = 'wallpaper';
            const selectedWallpaper = pickWeightedWallpaper();
            const wallpaperImg = $('summon-wallpaper-img');
            const wallpaperName = $('summon-wallpaper-name');

            if (selectedWallpaper) {
                if (wallpaperImg) wallpaperImg.src = selectedWallpaper.url;
                if (wallpaperName) wallpaperName.innerText = selectedWallpaper.name || '随机壁纸';
            } else {
                if (wallpaperName) wallpaperName.innerText = '暂未配置壁纸';
            }

            showSummonEndingPanel('summon-wallpaper-panel');
        }

        function backSummonEnding() {
            if (!state.isSummonEndingOpen) return;
            if (summonEndingStep === 'share' || summonEndingStep === 'wallpaper') {
                summonEndingStep = 'menu';
                showSummonEndingPanel('summon-choice-panel');
                renderSummonEndingChoices();
                return;
            }
            closeSummon();
        }

        function hideSummonEnding() {
            state.isSummonEndingOpen = false;
            summonEndingStep = 'name';
            const screen = $('summon-ending-screen');
            if (screen) screen.classList.add('hide');
            showSummonEndingPanel('summon-name-panel');
        }

        function closeDialogue() {
            clearTyping();
            state.isDialogue = false; isTyping = false; isChoiceMode = false; pages = ['']; pageIndex = 0; currentChoices = []; currentChoiceIndex = 0; currentNodeId = ''; currentNextNode = null;
            $('dialogue-container').classList.add('hide');
            $('dialogue-container').classList.remove('is-choice-page');
            $('choices-box').innerHTML = ''; $('message-text').innerText = '';
            $('page-next-icon').classList.add('hide');
            state.keys = { up: false, down: false, left: false, right: false };
            toggleDarkMask(false);
            // 📍 新增判定：如果是在召唤神明状态下关闭的对话，则顺便把 GIF 层也关了
            if (state.isSummonScreenOpen) {
                closeSummon();
            }
        }

        function openInventory() {
            if (state.isDialogue) closeDialogue();
            state.isInventoryOpen = true; $('inventory-screen').classList.remove('hide');
            toggleDarkMask(true);
            $('inv-dialogue-bg').src = DIALOGUE_BG['系统'];
            $('inv-avatar').src = state.selectedChar === 'char1' ? ASSETS.invAvatarChar1 : ASSETS.invAvatarChar2;
            $('inv-item-0').src = state.inventory[0] ? ASSETS.item0Collected : ASSETS.item0Uncollected;
            $('inv-item-1').src = state.inventory[1] ? ASSETS.item1Collected : ASSETS.item1Uncollected;
            $('inv-item-2').src = state.inventory[2] ? ASSETS.item2Collected : ASSETS.item2Uncollected;
            const gainMessageEl = $('inv-gain-message');
            if (gainMessageEl) {
                if (inventoryGainMessage) {
                    gainMessageEl.innerText = inventoryGainMessage;
                    gainMessageEl.classList.remove('hide');
                } else {
                    gainMessageEl.innerText = '';
                    gainMessageEl.classList.add('hide');
                }
            }
            if (state.inventory[0] && state.inventory[1] && state.inventory[2]) {
                $('summon-hint').classList.remove('hide');
            } else {
                $('summon-hint').classList.add('hide');
            }
        }

        function closeInventory() {
            state.isInventoryOpen = false; $('inventory-screen').classList.add('hide');
            inventoryGainMessage = '';
            const gainMessageEl = $('inv-gain-message');
            if (gainMessageEl) {
                gainMessageEl.innerText = '';
                gainMessageEl.classList.add('hide');
            }
            toggleDarkMask(false);
        }

        // ====== 召唤咖神逻辑更新 ======
        function triggerSummon() {
            if (state.isSummonScreenOpen) return;
            state.isSummonScreenOpen = true;
            $('summon-screen').classList.remove('hide');

            // 隐藏原本那个简单的静态文字提示
            const textContainer = $('summon-text-container');
            if (textContainer) textContainer.classList.add('hide');

            setTimeout(() => {
                $('summon-screen').classList.add('fade-in');
                setTimeout(() => {
                    $('summon-content').classList.add('fade-in');

                    // 📍 关键修改：保持 GIF 不动，约 1 秒后直接在上面弹出对话框
                    setTimeout(() => {
                        if (state.isSummonScreenOpen) {
                            // 咖神降临铺垫：让 GIF 先完整展示一段时间，再弹出对话框
                            openNode('summon_god_dialogue_1', '系统');
                        }
                    }, 1000);
                }, 800);
            }, 50);
        }
        function closeSummon() {
            hideSummonEnding();
            $('summon-screen').classList.remove('fade-in');
            $('summon-content').classList.remove('fade-in');
            setTimeout(() => {
                $('summon-screen').classList.add('hide');
                state.isSummonScreenOpen = false;
                closeInventory();
            }, 600);
        }

        function bindSimpleClick(el, handler) {
            if (!el) return;
            let lastRun = 0;
            const run = (e) => {
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                const now = Date.now();
                if (now - lastRun < 220) return;
                lastRun = now;
                handler(e);
            };
            // pointerdown 让手机端/触屏端立即响应；click 作为桌面和特殊浏览器的兜底
            el.addEventListener('pointerdown', run);
            el.addEventListener('click', run);
        }

        function bindDirection(id, key) {
            const el = $(id); if (!el) return;
            const start = (e) => {
                e.preventDefault();
                if (!state.hasGameStarted) return;
                // 选角状态下的特殊逻辑
                if (state.isSelectingChar) {
                    if (key === 'left' || key === 'right') {
                        state.selectedChar = (key === 'left') ? 'char1' : 'char2';
                        document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
                        $(`char-card-${state.selectedChar}`).classList.add('selected');
                    }
                    return;
                }
                if (state.isControlGuideOpen) return;
                if (state.isSummonEndingOpen) {
                    if (key === 'left' || key === 'right') moveSummonEndingChoice(key);
                    return;
                }
                state.player.direction = key;
                if (isChoiceMode) { if (key === 'up' || key === 'down') moveChoice(key); return; }
                if (!state.isDialogue && !state.isInventoryOpen && !state.isSummonScreenOpen) state.keys[key] = true;
            };
            const stop = (e) => { e.preventDefault(); state.keys[key] = false; };
            el.addEventListener('pointerdown', start); el.addEventListener('pointerup', stop); el.addEventListener('pointercancel', stop); el.addEventListener('pointerleave', stop);
        }

        function openControlGuide() {
            state.hasControlGuideShown = true;
            state.isControlGuideOpen = true;
            state.isTransitioning = false;
            state.keys = { up: false, down: false, left: false, right: false };
            if ($('control-guide-img')) $('control-guide-img').src = ASSETS.controlGuide;
            $('control-guide-screen').classList.remove('hide');
        }

        function closeControlGuideAndStartPanpan() {
            if (!state.isControlGuideOpen) return;
            state.isControlGuideOpen = false;
            $('control-guide-screen').classList.add('hide');
            setTimeout(() => openNode('panpan_start', 'panpan'), 120);
        }

        function startGame() {
            if (!state.isLoaded || state.hasGameStarted) return;
            startGameTimer();
            state.hasGameStarted = true; playBgm();
            $('start-screen').classList.add('hide');
            state.isSelectingChar = true;
            $('char-select-screen').classList.remove('hide');
        }

        function confirmCharacter() {
            if (!state.isSelectingChar) return;
            state.isSelectingChar = false; state.isTransitioning = true;
            const selectedCard = document.querySelector('.char-card.selected');
            if (selectedCard) selectedCard.classList.add('flash-action');
            setTimeout(() => {
                $('char-select-screen').classList.add('hide');
                if (selectedCard) selectedCard.classList.remove('flash-action');
                toggleDarkMask(false);
                if (!state.hasControlGuideShown) {
                    openControlGuide();
                } else {
                    state.isTransitioning = false;
                    setTimeout(() => openNode('panpan_start', 'panpan'), 300);
                }
            }, 600);
        }

        $('start-screen').onclick = startGame;
        $('btn-confirm-char').onclick = confirmCharacter;
        document.querySelectorAll('.char-card').forEach(card => {
            card.onclick = () => {
                if (!state.isSelectingChar) return;
                document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                state.selectedChar = card.dataset.char;
            };
        });
        $('close-dialogue').onclick = (e) => { e.stopPropagation(); closeDialogue(); };

        const summonNameInput = $('summon-name-input');
        if (summonNameInput) {
            summonNameInput.addEventListener('keydown', (e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                    e.preventDefault();
                }
            });
            summonNameInput.addEventListener('pointerdown', (e) => e.stopPropagation());
            summonNameInput.addEventListener('click', (e) => e.stopPropagation());
        }

        document.querySelectorAll('.summon-ending-choice').forEach((btn, index) => {
            btn.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                summonEndingChoiceIndex = index;
                renderSummonEndingChoices();
                confirmSummonEndingAction();
            });
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        // 重新绑定 A 键
        bindSimpleClick($('btn-a'), () => {
            // 1. 开屏阶段：按 A 开始游戏
            if (!state.hasGameStarted && !state.isSelectingChar) {
                startGame();
                return;
            }

            // 2. 选角阶段：按 A 确认角色
            if (state.isSelectingChar) {
                confirmCharacter();
                return;
            }

            // 2.5 选角后的键位说明：按 A 关闭说明图，再进入 panpan 对话
            if (state.isControlGuideOpen) {
                closeControlGuideAndStartPanpan();
                return;
            }

            // 3. 咖神昵称 / 分享 / 随机壁纸界面
            if (state.isSummonEndingOpen) {
                confirmSummonEndingAction();
                return;
            }

            // 4. 对话阶段优先级最高：包括普通 NPC、选项页、咖神召唤界面上的对话框
            if (isTyping) {
                finishTyping();
                return;
            }
            if (isChoiceMode) {
                confirmChoice();
                return;
            }
            if (state.isDialogue) {
                nextDialoguePage();
                return;
            }

            // 4. 咖神动画播放中、对话框还没出现时，A 不重复触发召唤，避免多个定时器叠在一起
            if (state.isSummonScreenOpen) {
                return;
            }

            // 5. 背包打开且三件物品已集齐：按 A 召唤咖神
            if (state.isInventoryOpen) {
                if (state.inventory[0] && state.inventory[1] && state.inventory[2]) {
                    triggerSummon();
                }
                return;
            }

            // 6. 常规场景交互
            tryInteract();
        });

        bindSimpleClick($('btn-b'), () => {
            if (state.isControlGuideOpen) return;
            if (state.isSummonEndingOpen) {
                backSummonEnding();
                return;
            }

            // 📍 优先判断：如果正在对话，先走对话关闭流程
            if (state.isDialogue) {
                closeDialogue();
                return;
            }

            // 如果只是单纯开着 GIF 没对话，按 B 直接关闭
            if (state.isSummonScreenOpen) {
                closeSummon();
                return;
            }

            if (state.isInventoryOpen) { closeInventory(); return; }
        }); bindSimpleClick($('btn-select'), () => {
            if (state.isSummonScreenOpen || state.isSummonEndingOpen || state.isControlGuideOpen) return;
            if (state.isDialogue) closeDialogue();
            if (state.isInventoryOpen) { closeInventory(); } else { openInventory(); }
        });
        bindDirection('up', 'up'); bindDirection('down', 'down'); bindDirection('left', 'left'); bindDirection('right', 'right');
        const fontReady = document.fonts ? document.fonts.ready : Promise.resolve();
        Promise.all([fontReady, preloadAllImages()]).then(() => {
            initStaticImages();
            updateResponsiveScale();

            window.addEventListener('resize', updateResponsiveScale);
            window.addEventListener('orientationchange', updateResponsiveScale);

            state.isLoaded = true;
            $('start-image-flash').classList.remove('hide');
            gameLoop();
        }).catch(err => {
            console.warn("部分资源加载失败，强制进入游戏流程");
            initStaticImages();
            state.isLoaded = true;
            $('start-image-flash').classList.remove('hide');
            gameLoop();
        });


    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGame);
    } else {
        initGame();
    }
})();