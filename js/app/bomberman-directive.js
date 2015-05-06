'use strict';

app.directive('ngKeydown', ['bomb', 'bricks', 'boxes', 'fireUp', 'bombUp', 'enemy', '$timeout', function(bomb, bricks, boxes, fireUp, bombUp, enemy, $timeout) {

    function link (scope, elem, attrs) {
        // on the keydown event, check the keycode of the pressed key and apply the needed action
        elem.on('keydown', function(e){   
            if(!scope.keyActionEnabled){return;} //if key actions are disabled don't do anything
            if (e.which > 36 && e.which < 41) //Arrow keys = movement
                applyTransition(e.which);
            else if (e.which === 32 && bomb.getBombLimit() > 0){ //Backspace key = plant bomb                
                var bombID = bomb.insertBomb(scope.bomber_top, scope.bomber_left);
                elem.append(angular.element('<div class="image bomb bomb_num_'+ bombID +'" style="top:'+ scope.bomber_top +'px;left:'+ scope.bomber_left +'px;"></div>'));
                scope.bomb_action_time = 3000; //make sure this value is set to 3 sec
                bomb_explotion(bombID, scope.bomber_top, scope.bomber_left);                            
            }
        });

        //------------------------------------------------------------------------------------
        //                  Bomberman Actions - DOM manipulation
        //------------------------------------------------------------------------------------

        //Applies Bomberman's movement based on the arrow keys
        var applyTransition = function (keyCode) {
            switch (keyCode){
                case 37: //left
                    Bomberman_move(scope.bomber_top, scope.bomber_left - 50);
                    break;
                case 38: //up
                    Bomberman_move(scope.bomber_top - 50, scope.bomber_left);
                    break;
                case 39: //right
                    Bomberman_move(scope.bomber_top, scope.bomber_left + 50);
                    break;
                case 40: //bottom
                    Bomberman_move(scope.bomber_top + 50, scope.bomber_left);
                    break;
            }
            check_Bomberman_Death(scope.bomber_top, scope.bomber_left); 
        }

        //Checks the position of Bomberman after each movement and launches game_over if needed
        var check_Bomberman_Death = function (top, left) {
            //Checking flames collision if some present
            if(bomb.checkFlamesCollision(top,left))
                game_over();
            
            //Checks if there's any enemy collision
            if(enemy.checkCollision(top,left,false))
                game_over();
        }

        //Checks Bomberman's movement and allows it if not a wall or box
        var Bomberman_move = function (top, left) {
            //If there's no bricks the map was not load correctly
            if(bricks.getAllBricks().length == 0){return;}
            
            //Checks if the user won
            winner();

            //Checks bricks collisions
            if(bricks.checkCollision(top,left))
                return false;

            //Checks boxes collisions
            if(boxes.checkCollision(top,left,false))
                return false;

            //Checks bombs collisions
            if(bomb.checkCollision(top,left,false))
                return false;

            //Checks fireUp power collision and adds power if so
            if(fireUp.checkCollision(top,left)){
                bomb.increaseBombLength();
                angular.element(".fireup[style='top:"+ top +"px;left:"+ left +"px;']").remove();
            }

            //Checks bombUp power collision and adds power if so
            if(bombUp.checkCollision(top,left)){
                bomb.increaseBombLimit();
                angular.element(".bombup[style='top:"+ top +"px;left:"+ left +"px;']").remove();
            }

            //If no collision found then allow bomberman to move
            scope.bomber_top = top;
            scope.bomber_left = left;            
            return true;
        }

        //BombermanPJ was destroyed and game over options will appear
        var game_over = function () {
            angular.element('.bombermanPj').addClass('explode');
            scope.keyActionEnabled = false;
            $timeout(function() {
                angular.element('.bombermanPj').css('background', 'none');
                scope.modalShown = !scope.modalShown;            
            }, 3000); //The pj explosion dissapears after 3 sec
        }

        //Check if the map is clean then the game is over and the user wins
        var winner = function () {
            if(enemy.getAllEnemies().length == 0 && boxes.getAllBoxes().length == 0){
                scope.modalShown = !scope.modalShown; 
                angular.element('.ng-modal-dialog-content').css('background', 'url("./css/images/victory.png") no-repeat center center');
            }
        }

        //------------------------------------------------------------------------------------
        //                  Bomb Actions - DOM manipulation
        //------------------------------------------------------------------------------------

        //Checks the fire movement and evaluates wether it can expands or not
        var Fire_Move = function (flame, bombID, top, left) {
            //If there's no bricks the map was not load correctly
            if(bricks.getAllBricks().length == 0){return;}

            //Check bricks collisions
            if(bricks.checkCollision(top,left))
                return false;

            //Check boxes collisions
            if(boxes.checkCollision(top,left,flame)){
                //If it is allows to burn it then it will remove the box from the DOM
                // and put the flame instead
                if(flame){
                    angular.element(".box[style='top:"+ top +"px;left:"+ left +"px;']").remove();
                    elem.append(angular.element('<div class="image flame flame_num_'+ bombID +'" style="top:'+ top +'px;left:'+ left +'px;"></div>'));
                    bomb.addFlames(bombID, top, left);                    
                }
                return false;
            }

            //Checks bombs collisions
            if(bomb.checkCollision(top,left,flame)){
                if(flame){
                    var element = angular.element(".bomb[style='top:"+ top +"px;left:"+ left +"px;']");
                    if(element.length > 0){
                        var className = element[0].className.split(" "),
                            className = className[className.length-1].split("_");
                        scope.bomb_action_time = 0; //Imediate explosion
                        bomb_explotion(className[className.length-1], top, left);
                    }
                }
            }

            //Checks enemies collision
            if (enemy.checkCollision(top,left,flame)){                        
                if(flame){
                    angular.element(".enemy[style='top:"+ top +"px;left:"+ left +"px;']").remove();
                    elem.append(angular.element('<div class="image flame flame_num_'+ bombID +'" style="top:'+ top +'px;left:'+ left +'px;"></div>'));
                    bomb.addFlames(bombID, top, left); 
                }
                return false;
            }

            //Checks fireUp power collision and removes it
            if (fireUp.checkCollision(top,left)){
                angular.element(".fireup[style='top:"+ top +"px;left:"+ left +"px;']").remove();
            }

            //Checks bombUp power collision and removes it
            if(bombUp.checkCollision(top,left)){
                angular.element(".bombup[style='top:"+ top +"px;left:"+ left +"px;']").remove();
            }
            
            //If no collision found and it is allowed to go that side then expand the fire
            if(flame){
                elem.append(angular.element('<div class="image flame flame_num_'+ bombID +'" style="top:'+ top +'px;left:'+ left +'px;"></div>'));
                bomb.addFlames(bombID, top, left); 
            }            
            return true;
        };

        //Function to remove the bomb and flames
        var flames_away = function (bombID) {
            $timeout(function() {
                //removes the bomb flames from the view
                angular.element('.flame_num_'+ bombID).remove();
                //removes the bomb object
                bomb.removeBomb(bombID);
            }, 2000); //flames dissapear after 2 sec
        };

        //Function that controls the explotion of the bomb, removing the bomb and adding flames
        var bomb_explotion = function (bombID, top, left) {
            $timeout(function() {
                //If the bomb is no longer present it is probably because it was actioned by other bomb
                if(angular.element(".bomb[style='top:"+ top +"px;left:"+ left +"px;']").length === 0) {return;}
                //Removes the bomb from the DOM and puts the middle fire instead                
                angular.element('.bomb_num_'+ bombID).remove(); 
                elem.append(angular.element('<div class="image flame flame_num_'+ bombID +'" style="top:'+ top +'px;left:'+ left +'px;"></div>'));

                var moveRight = true,
                    moveLeft = true,
                    moveBottom = true,
                    moveTop = true;

                //Loop to expand flames depending on bomb power "bombLength"
                for(var i = 1; i <= bomb.getBombLength(); i++){   
                    if(!Fire_Move(moveRight, bombID, top, (left + 50*i)))
                        moveRight = false;
                    if(!Fire_Move(moveLeft, bombID, top, (left - 50*i)))
                        moveLeft = false;
                    if(!Fire_Move(moveBottom, bombID, (top + 50*i), left))
                        moveBottom = false;
                    if(!Fire_Move(moveTop, bombID, (top - 50*i), left))
                        moveTop = false;
                }

                //Once finished the bombLimit is reseted as before and checks if bomberman
                // was in the middle of the fire the moment it was activated
                bomb.increaseBombLimit();
                check_Bomberman_Death(scope.bomber_top, scope.bomber_left);
                //Checks if the user won
                winner();
                //Call this functio to start the countdown for the fire to go away
                flames_away(bombID);
            }, scope.bomb_action_time); //The bomb dissapears after 3 sec
        };
    }

    return {
        restrict: 'A',
        link: link
    };
}]);