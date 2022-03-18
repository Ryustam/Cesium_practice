//////////////////////////
//  map 관련 함수 세팅   //
//////////////////////////

let nkMap;

$(document).ready(async function(){
	// 테스트 데이터
	let testObsArr = [
		{
			position: {lon: 128.89817167772094, lat: 35.12037076701454},
			data: {
				info: {
					type: commonConst.MAP_MAIN_WATERQUALITY,
					popType: commonConst.POP_MAIN_FACILITY,
					typeName: '수질',
					obsName: '평강수문(보)'
				},
				operation: {
					depth: 0.0,		// 수심
					temp: 24.60,	// 수온
					ec: 521.00,		// EC
					psu: 0.24,		// 염분
					ph: 6.70,		// PH
					do: 3.90		// DO
				}
			}
		},
	];

	// 테스트 데이터 - 관측소 정보
	let obsArr = [
		{type: commonConst.MAP_MAIN_WATERQUALITY, popType: commonConst.POP_MAIN_FACILITY, menuType: commonConst.MENU_MAIN, position: {lon: 128.9511889, lat: 35.1007355}},
		{type: commonConst.MAP_MAIN_WATERGATE, popType: commonConst.POP_MAIN_FACILITY, menuType: commonConst.MENU_MAIN, position: {lon: 128.950681, lat: 35.1018157}},
		{type: commonConst.MAP_MAIN_GROUNDWATER, popType: commonConst.POP_MAIN_FACILITY, menuType: commonConst.MENU_MAIN, position: {lon: 128.9452971, lat: 35.1138875}},
		{type: commonConst.MAP_MAIN_WATERQUALITY, popType: commonConst.POP_MAIN_FACILITY, menuType: commonConst.MENU_MAIN, position: {lon: 128.9509949, lat: 35.1453043}},
		{type: commonConst.MAP_MAIN_FLUX, popType: commonConst.POP_MAIN_FACILITY, menuType: commonConst.MENU_MAIN, position: {lon: 128.9860326, lat: 35.1489009}}
	];

	//nkCesium 객체 생성
	nkMap = new nkCesium();
	
	await nkMap.cesiumInit('map'); //cesium 초기 세팅
	nkMap.mapClickInit();//맵 클릭 이벤트 세팅

	//마커 표시
	obsArr.forEach(function(item, index) {
		let data = {
			info: {
				type: item.type,
				popType: item.popType
			}
		}

		nkMap.addMarkerItem(commonConst.MARKER_ICON_WATERQUALITY_URL, item.position, data);
	});	
});



let nkCesium = function() {

	//전역변수
	let global = {
			viewer: null,
			markerItems: [],
			handler: null,
			imageryLayer: {}
	}
	
	/**
	 * 세슘 기능을 초기 세팅 한다.
	 * @param {String} containerId Cesium을 load 할 Div Id값
	 */
	function cesiumInit(containerId){
		//세슘 viewer 세팅
		let viewer = new Cesium.Viewer(containerId, {
			infoBox: false, //infobox
		    selectionIndicator: false,
		    fullscreenButton : false, //전체화면 버튼
		    baseLayerPicker : false,
		    geocoder : false,
		    homeButton : false, //홈버튼
		    sceneModePicker : false,
		    navigationHelpButton : false,
		    timeline: false, //하단 타임라인
		    animation: false,
			geocoder:false,
			//shouldAnimate: false,
			shouldAnimate: true,
		    contextOptions: {
		        webgl:{preserveDrawingBuffer:true}
		    },
			terrainProvider: Cesium.createWorldTerrain(),
			navigationInstructionsInitiallyVisible: false,
			clock: {
				currentTime: Cesium.JulianDate.fromIso8601('2013-12-25')
			}
		});

		//세슘 2D 고정
		viewer.scene.mode = Cesium.SceneMode.SCENE2D

		//세슘 기본 imageryLayer 끄기
		//viewer.imageryLayers._layer[0].show = false;

		//세슘 로고 삭제
		viewer._cesiumWidget._creditContainer.parentNode.removeChild(viewer._cesiumWidget._creditContainer);

		//전역에서 사용하기 위해 global에 담기
		global.viewer = viewer;
		
		//초기 화면 이동
		viewer.camera.flyTo({
			destination : Cesium.Cartesian3.fromDegrees(128.9570124, 35.1592607, 32000),
			//orientation: {
		    //    heading : heading,
		    //    roll : roll
		    //},
			duration: 3
		});
		
		//세슘 imageryLayer 세팅
		cesiumImageryLayerInit();
		//세슘 맵 이벤트 세팅
		cesiumEventInit();
	};

	/**
	 * 세슘 imageryLayer를 추가한다
	 */
	function cesiumImageryLayerInit(){
		let viewer = global.viewer;
		//Base: vworld 기본 레이어 추가
		//layer를 불러온다.
		var wms_vworld = new Cesium.WebMapTileServiceImageryProvider({ 
			url : 'http://api.vworld.kr/req/wmts/1.0.0/1C884A14-23FF-3BBF-B742-2B566665DEB4/Base/{TileMatrix}/{TileRow}/{TileCol}.png',
			layer : 'Base',
			style : 'default',
			format : 'image/jpeg',
			tileMatrixSetID : 'default028mm',
			maximumLevel: 19
		});
		//viewer에 추가
		let baseLayer = viewer.imageryLayers.addImageryProvider(wms_vworld);
		baseLayer.show = false;

		//Satellite: vworld 위성 레이어 추가
		//layer를 불러온다.
		var wms_vworld = new Cesium.WebMapTileServiceImageryProvider({ 
			url : 'http://api.vworld.kr/req/wmts/1.0.0/1C884A14-23FF-3BBF-B742-2B566665DEB4/Satellite/{TileMatrix}/{TileRow}/{TileCol}.jpeg',
			layer : 'Satellite',
			style : 'default',
			format : 'image/jpeg',
			tileMatrixSetID : 'default028mm',
			maximumLevel: 19
		});
		//viewer에 추가
		let satLayer = viewer.imageryLayers.addImageryProvider(wms_vworld);
		satLayer.show = true;

		//layer 변경에 사용하기 위해 global에 담기
		global.imageryLayer[commonConst.MAP_IMAGERY_LAYER_BASE] = baseLayer;
		global.imageryLayer[commonConst.MAP_IMAGERY_LAYER_SATELLITE] = satLayer;
	}

	/**
	 * 마커를 지도에 추가한다.
	 * @param {String} image 마커에 사용될 이미지
	 * @param {Object} position 마커가 위치할 위치 정보 {number lon, number lat}
	 * @param {Object} 마커에 포함시킬 사용자 정의 data
	 */
	function addMarkerItem(imageURL, markerPosition, markerData) {
		if(global != null) {
			let markerItem = global.viewer.entities.add({
				position: Cesium.Cartesian3.fromDegrees(markerPosition.lon, markerPosition.lat),	// 마커가 위치할 좌표 (Cartesian3)
				billboard: {
					image: imageURL,			// 이미지의 URL
					width: 32,					// 이미지의 가로 크기 (pixel)
					height: 32					// 이미지의 세로 크기 (pixel)
				},
				data: markerData
			});
	
			global.markerItems.push(markerItem);
		}
	}

	/**
	 * checkbox 마커의 토글 기능
	 * @param {String} code 현재 선택된 체크박스의 코드
	 * @param {Boolean} isShow 마커 표출 여부
	 */
	function toggleMarkerItem(code, isShow){
		let items = global.markerItems; //마커 배열
		items.forEach(function(item){
			if(code == '0') //전체 체크박스 선택 시
			{ 
				item.show = isShow; //전체 마커 조절
			} 
			else //개별 체크박스 선택 시
			{ 
				if(item.data.info.type == code) { //개별 코드에 맞는 마커만 조절
					item.show = isShow;
				}
			}
		});
	}

	/**
	 * 세슘 이벤트 초기 세팅 함수
	 */
	function cesiumEventInit(){
		let viewer = global.viewer;
		let handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

		handler.setInputAction(function(event){
			let pickedObject = viewer.scene.pick(event.position);			// 클릭한 곳의 객체

			if(pickedObject != null && pickedObject.primitive != undefined) {
			let pickedObjectCartesian = pickedObject.primitive._position;	// 클릭한 객체의 좌표 (Cartesian3)
			let pickedObjectData = pickedObject.id.data;					// 클릭한 객체의 정보

			if(pickedObjectData != undefined) {
				nkPopup.openPopup(pickedObjectData.info.popType, pickedObjectCartesian, commonConst.POP_TYPE_NONFIX);
			}
		}

		}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

		global.handler = handler;
	}

	/**
	 * 맵 관련 클릭 이벤트를 세팅
	 */
	function mapClickInit(){
		//맵 기본, 위성 지도 변경 버튼 함수
		$('.layerBtn').off('click')
		$('.layerBtn').on('click',function(){
			toggleImageLayer(this); //레이어 변경 함수
		});

		//zoom 버튼 함수
		$('.mapZoomBtn').off('click');
		$('.mapZoomBtn').on('click',function(){
			let _this = $(this);
			let isZoom = _this.data('zoom');	//zoom 버튼 타입

			//줌 기능 실행
			zoomMap(isZoom);
		})

		//전체화면 버튼 함수
		$('#mapExpandBtn').off('click')
		$('#mapExpandBtn').on('click', function(){
			let _this = $(this);
			let isFull = _this.find('i').attr('class') == 'xi-expand' ? false : true; //현재 전체화면 여부

			if(!isFull) { //전체화면 false일 경우 전체화면 기능 실행
				Cesium.Fullscreen.requestFullscreen(document.body); //전체화면 실행
				//버튼 아이콘 변경
				$('#mapExpandBtn i').removeClass('xi-expand');
				$('#mapExpandBtn i').addClass('xi-compress');
			} else { //전체화면 true일 경우 전체화면 종료
				Cesium.Fullscreen.exitFullscreen(); //전체화면 끄기
				//버튼 아이콘 변경
				$('#mapExpandBtn i').removeClass('xi-compress');
				$('#mapExpandBtn i').addClass('xi-expand');
			}
		})
	}

	/**
	 * 선택된 레이터 타입으로 image Layer를 변경한다.
	 * @param {Object} ctx 선택된 레이어 버튼(this)
	 */
	function toggleImageLayer(ctx){
		let selectedCtx = $(ctx);
		let layerType = selectedCtx.data('layer'); //선택된 버튼의 지도 layer 타입

		$('.layerBtn').removeClass('on'); //기존의 버튼 선택 제거
		selectedCtx.addClass('on'); //현재 버튼 선택

		//등록된 지도 layer에 대한 반복
		for(key in global.imageryLayer) {
			if(key == layerType) { //선택된 버튼과 같은 타입의 지도 layer 표출
				global.imageryLayer[key].show = true;
			} else { //다른 타입의 지도 숨기기
				global.imageryLayer[key].show = false;
			}
		}
	}

	/**
	 * 맵 줌인, 아웃 함수
	 * @param {Boolean} type zoom in, out을 체크한다 (true: in, false: out)
	 * @returns 
	 */
	function zoomMap(type){
		let viewer = global.viewer;
		let cameraHeight = viewer.camera.positionCartographic.height; //현재 카메라 높이

		if(type) { //zoom In
			if(cameraHeight < 500) { return; } //zoom 최대값
			viewer.camera.zoomIn(2 * cameraHeight / 10); //현재 카메라 높이에 맞게 zoom in
		} else { //zoom Out
			if(cameraHeight > 900000) { return; } //zoom 최소값
			viewer.camera.zoomOut(2 * cameraHeight / 10); //현재 카메라 높이에 맞게 zoom out
		}
	}
	
	
	
	
	//return Obj
	let returnObj = {
			global: global,
			cesiumInit: cesiumInit,
			mapClickInit: mapClickInit,
			addMarkerItem: addMarkerItem,
			toggleMarkerItem: toggleMarkerItem
	}
	
	return returnObj;
}