const INITIAL_BOUNDS = [
  [-12, 72],
  [55, 146],
];

const grades = [0, 1, 2, 3, 4, 5];
const colors = ["#fff4c7", "#fed98e", "#fdae61", "#f46d43", "#d73027", "#7f1d1d"];

const map = L.map("map", {
  zoomControl: true,
  minZoom: 3,
  maxZoom: 9,
  worldCopyJump: true,
});

map.fitBounds(INITIAL_BOUNDS, { padding: [24, 24] });

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

const regionLayers = new Map();
let selectedLayer = null;
let markerLayer = L.layerGroup().addTo(map);
let regionData;
let shopData;

function getColor(count) {
  if (count >= 5) return colors[5];
  if (count >= 4) return colors[4];
  if (count >= 3) return colors[3];
  if (count >= 2) return colors[2];
  if (count >= 1) return colors[1];
  return colors[0];
}

function regionStyle(feature) {
  return {
    fillColor: getColor(feature.properties.count),
    weight: 1.2,
    opacity: 1,
    color: "#ffffff",
    dashArray: "",
    fillOpacity: 0.78,
  };
}

function highlightedStyle() {
  return {
    weight: 3,
    color: "#4d4d4d",
    dashArray: "",
    fillOpacity: 0.86,
  };
}

const info = L.control({ position: "topright" });

info.onAdd = function onAdd() {
  this._div = L.DomUtil.create("div", "info leaflet-control");
  this.update();
  return this._div;
};

info.update = function update(properties) {
  if (!properties) {
    this._div.innerHTML = `
      <h2>门店数量</h2>
      <p class="region-name">中国与东南亚</p>
      <p class="region-meta">悬停查看区域，点击区域可聚焦放大。</p>
    `;
    return;
  }

  this._div.innerHTML = `
    <h2>${properties.group}</h2>
    <p class="region-name">${properties.fullName}</p>
    <p class="region-meta"><strong>${properties.count}</strong> 个示例地点<br />点击点位查看门店详情</p>
  `;
};

info.addTo(map);

const legend = L.control({ position: "bottomright" });

legend.onAdd = function onAdd() {
  const div = L.DomUtil.create("div", "legend leaflet-control");
  div.innerHTML = '<div class="legend-title">门店数量</div>';

  for (let i = 0; i < grades.length; i += 1) {
    const from = grades[i];
    const to = grades[i + 1];
    const label = to ? `${from}-${to}` : `${from}+`;
    div.innerHTML += `
      <div class="legend-row">
        <i style="background:${getColor(from || 0)}"></i>
        <span>${label}</span>
      </div>
    `;
  }

  return div;
};

legend.addTo(map);

function resetLayer(layer) {
  layer.setStyle(regionStyle(layer.feature));
}

function highlightFeature(event) {
  const layer = event.target;
  if (layer !== selectedLayer) {
    layer.setStyle(highlightedStyle());
    layer.bringToFront();
  }
  info.update(layer.feature.properties);
}

function resetHighlight(event) {
  const layer = event.target;
  if (layer !== selectedLayer) resetLayer(layer);
  if (!selectedLayer) info.update();
  if (selectedLayer) info.update(selectedLayer.feature.properties);
}

function selectRegion(layer) {
  if (selectedLayer && selectedLayer !== layer) {
    resetLayer(selectedLayer);
  }

  selectedLayer = layer;
  layer.setStyle(highlightedStyle());
  layer.bringToFront();
  info.update(layer.feature.properties);
  map.fitBounds(layer.getBounds(), { padding: [64, 64], maxZoom: 7 });
  renderMarkers(layer.feature.properties.id);
}

function onEachFeature(feature, layer) {
  regionLayers.set(feature.properties.id, layer);
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: () => selectRegion(layer),
  });
}

function popupContent(shop) {
  return `
    <article class="shop-popup">
      <h3>${shop.name}</h3>
      <p><strong>区域：</strong>${shop.region}</p>
      <p><strong>地址：</strong>${shop.address}</p>
      <p>${shop.description}</p>
    </article>
  `;
}

function createMarker(shop) {
  const marker = L.marker([shop.coordinates[1], shop.coordinates[0]], {
    title: shop.name,
    icon: L.divIcon({
      className: "",
      html: '<span class="shop-marker"></span>',
      iconSize: [13, 13],
      iconAnchor: [6, 6],
      popupAnchor: [0, -8],
    }),
  });

  marker.bindPopup(popupContent(shop), {
    maxWidth: 300,
    closeButton: true,
  });

  return marker;
}

function renderMarkers(regionId) {
  markerLayer.clearLayers();
  const shops = regionId
    ? shopData.filter((shop) => shop.regionId === regionId)
    : shopData;

  shops.forEach((shop) => markerLayer.addLayer(createMarker(shop)));
}

function resetView() {
  if (selectedLayer) {
    resetLayer(selectedLayer);
    selectedLayer = null;
  }
  info.update();
  renderMarkers();
  map.fitBounds(INITIAL_BOUNDS, { padding: [24, 24] });
}

document.getElementById("resetView").addEventListener("click", resetView);

async function initMap() {
  const [regionsResponse, shopsResponse] = await Promise.all([
    fetch("data/regions.geojson"),
    fetch("data/shops.json"),
  ]);

  regionData = await regionsResponse.json();
  shopData = await shopsResponse.json();

  L.geoJson(regionData, {
    style: regionStyle,
    onEachFeature,
  }).addTo(map);

  renderMarkers();
}

initMap().catch((error) => {
  console.error(error);
  info._div.innerHTML = `
    <h2>地图加载失败</h2>
    <p class="region-meta">请确认 data/regions.geojson 与 data/shops.json 可以被访问。</p>
  `;
});
