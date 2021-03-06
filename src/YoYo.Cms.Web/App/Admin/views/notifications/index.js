﻿(function() {
    "use strict";

    yoyocmsModule
        .controller("app.views.natifications.index",
        [
            "$scope", "$state",'appSession',  "uiGridConstants", 
            "abp.services.app.notification",
            function ($scope, $state, appSession,  uiGridConstants,  notificationService) {
                var vm = this;
             //   console.log($state.current);
                $state.current.title = $state.current.displayName;


                vm.isread = "ALL";
                vm.loading = false;
                $scope.$on("$viewContentLoaded",
                    function() {
                    });

                var requestParams = {
                    skipCount: 0,
                    maxResultCount: app.consts.grid.defaultPageSize
                };

                vm.gridOptions = {
                    enableHorizontalScrollbar: uiGridConstants.scrollbars.WHEN_NEEDED,
                    enableVerticalScrollbar: uiGridConstants.scrollbars.WHEN_NEEDED,
                    paginationPageSizes: app.consts.grid.defaultPageSizes,
                    paginationPageSize: app.consts.grid.defaultPageSize,
                    useExternalPagination: true,
                    enableSorting: false,
                    appScopeProvider: vm,
                    rowTemplate:
                        '<div ng-repeat="(colRenderIndex, col) in colContainer.renderedColumns track by col.colDef.name" class="ui-grid-cell" ng-class="{ \'ui-grid-row-header-cell\': col.isRowHeader, \'notification-read\' : row.entity.state == \'READ\' }"  ui-grid-cell></div>',
                    columnDefs: [
                        {
                            name: app.localize("Actions"),
                            width: 80,
                            cellTemplate:
                                '<div   class=\"ui-grid-cell-contents text-center\">' +
                                    '  <button  ng-click="grid.appScope.makeNotificationAsRead(row.entity)" ng-disabled="row.entity.state==\'READ\'" class="btn btn-xs btn-primary" title="' +
                                    app.localize("SetAsRead") +
                                    '">' +
                                    '    <i class="fa" ng-class="{\'fa-check\': row.entity.state == \'READ\', \'fa-circle-o\': row.entity.state == \'UNREAD\'}"></i>' +
                                    "  </button>" +
                                    "</div>"
                        },
                        {
                            name: app.localize("Notification"),
                            field: "text",
                            minWidth: 300,

                            cellTemplate:
                                '<div class=\"ui-grid-cell-contents\">' +
                                    '  <a ng-if="row.entity.url" ng-href="{{row.entity.url}}" title="{{row.entity.text}}">{{row.entity.text}}</a>' +
                                    '  <span ng-if="!row.entity.url" title="{{row.entity.text}}">{{row.entity.text}}</span>' +
                                    "</div>"
                        },
                        {
                            name: app.localize("CreationTime"),
                            field: "time",
                            cellTemplate:
                                '<div class=\"ui-grid-cell-contents\">' +
                                    '  <span title="{{row.entity.time | momentFormat: \'llll\'}}">{{COL_FIELD CUSTOM_FILTERS}}</span> &nbsp;' +
                                    "</div>",
                            cellFilter: "fromNow",
                            width: 150
                        }
                    ],
                    onRegisterApi: function(gridApi) {
                        $scope.gridApi = gridApi;
                        $scope.gridApi.core.on.sortChanged($scope,
                            function(grid, sortColumns) {
                                if (!sortColumns.length || !sortColumns[0].field) {
                                    requestParams.sorting = null;
                                } else {
                                    requestParams.sorting = sortColumns[0].field + " " + sortColumns[0].sort.direction;
                                }

                                vm.getNotifications();
                            });
                       //手动修改分页
                        gridApi.pagination.on.paginationChanged($scope,
                            function(pageNumber, pageSize) {
                                requestParams.skipCount = (pageNumber - 1) * pageSize;
                                requestParams.maxResultCount = pageSize;

                                vm.getNotifications();
                            });
                    },
                    data: []
                };


                //设置消息为已读
                vm.makeNotificationAsRead = function (userNotification) {
                    notificationService.makeNotificationAsRead({ id: userNotification.id }).
                        then(function () {
                            for (var i = 0; i < vm.userNotifications.length; i++) {
                                if (vm.userNotifications[i].id == userNotification.id) {
                                    vm.userNotifications[i].state = 'READ';
                                }
                            }
                            vm.unReadUserNotificationCount -= 1;

                        });
                }
                //格式化消息
                var formattedMessage = function (item) {

                    var message = {
                        id: item.id,
                        text: abp.notifications.getFormattedMessageFromUserNotification(item),
                        time: item.notification.creationTime,
                        image: getNotificationImgBySeverity(item.notification.severity),
                        state: abp.notifications.getUserNotificationStateAsString(item.state),
                    }

                    return message;

                }
                //获取图片路径
                function getNotificationImgBySeverity(severity) {
                    switch (severity) {
                        case abp.notifications.severity.SUCCESS:
                            return '/App/assets/yoyocms/notification/1.png';
                        case abp.notifications.severity.WARN:
                            return '/App/assets/yoyocms/notification/2.png';
                        case abp.notifications.severity.ERROR:
                            return '/App/assets/yoyocms/notification/3.png';
                        case abp.notifications.severity.FATAL:
                            return '/App/assets/yoyocms/notification/4.png';
                        case abp.notifications.severity.INFO:
                        default:
                            return '/App/assets/yoyocms/notification/0.png';
                    }
                }
                vm.getNotifications = function() {

                    var state = null;
                    if (vm.isread === "UNREAD") {
                        state = abp.notifications.userNotificationState.UNREAD;
                    }

                    vm.loading = true;
                    notificationService.getPagedUserNotificationsAsync({
                        skipCount: requestParams.skipCount,
                        maxResultCount: requestParams.maxResultCount,
                        state: state
                    }).then(function(result) {
                      console.log(result);
                        vm.gridOptions.totalItems = result.data.totalCount;
                        vm.gridOptions.data = _.map(result.data.items,
                            function(item) {
                                return formattedMessage(item, false);
                            });
                        //   console.log(vm.gridOptions.data);
                    }).finally(function() {
                        vm.loading = false;
                    });
                };

                vm.getNotifications();


                vm.conread = function() {
                    console.log(vm.isread);
                };
            }
        ]);


})();