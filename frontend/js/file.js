closestImageRGB(rootNode,point){
    this.quadPoints = 0

    if(rootNode.rootQuad.isDivided == False){
        // print("corresponding quad found")
        let that = this
        rootNode.rootQuad.points.forEach(function(point2){
            // print(math.sqrt(((point.x-point2.x)**2)+((point.y-point2.y)**2)+((point.y-point2.y)**2)),point2.x,point2.y,point2.z)
            if(Math.sqrt((Math.pow((point.x-point2.x),2))+(Math.pow((point.y-point2.y),2))+(Math.pow((point.y-point2.y),2)) < lowestDist)){
                lowestDist = Math.sqrt((Math.pow((point.x-point2.x),2))+(Math.pow((point.y-point2.y),2))+(Math.pow((point.y-point2.y),2)) < lowestDist)
                lowestDistPoint = point2
            }else{
                continue
            }
        })      
    }

                
    octree = self.getChildren(rootQuad)

    for(var i = 0;i < octree.length-1; i++){
        if(emptyQuad == true){
            // print("previous quad was empty")
            if(len(octree[i].rootQuad.points) != 0){
                if(octree[i].rootQuad.isDivided != true){
                    if(len(octree[i].rootQuad.points) == 0){
                        // print("quad was empty finding closest point amoungst neighboring quads")
                        itrs = 0
                        if(i-1 > 0 && i+1 <= 8){
                            while(i-1 > 0 && i+1 <= 8){
                                // print("searching from middle")
                                if(len(octree[i-itrs].rootQuad.points) != 0 || len(octree[i+itrs].rootQuad.points) != 0){
                                    emptyQuad = False
                                    mergedPoints = octree[i-1].rootQuad.points + octree[i+1].rootQuad.points
                                    let that = this;
                                    mergedPoints.forEach(function(point2){
                                     // print(math.sqrt(((point.x-point2.x)**2)+((point.y-point2.y)**2)+((point.y-point2.y)**2)),point2.x,point2.y,point2.z)
                                        if(Math.sqrt((Math.pow((point.x-point2.x),2))+(Math.pow((point.y-point2.y),2))+(Math.pow((point.y-point2.y),2)) < lowestDist)){
                                            lowestDist = Math.sqrt((Math.pow((point.x-point2.x),2))+(Math.pow((point.y-point2.y),2))+(Math.pow((point.y-point2.y),2)) < lowestDist)
                                            lowestDistPoint = point2
                                        }else{
                                            continue
                                        }
                                    })                                      
                                }else{
                                    continue
                                }                                
                            }
                        }else if(i-1 < 0){
                            while(i+1 <= 8){
                                // print("searching from end")
                                if(len(octree[i+itrs].rootQuad.points) != 0){
                                    emptyQuad = False
                                    let that = this
                                    octree[i+itrs].rootQuad.points.forEach(function(point2){
                                        //  print(math.sqrt(((point.x-point2.x)**2)+((point.y-point2.y)**2)+((point.y-point2.y)**2)),point2.x,point2.y,point2.z)
                                        if(Math.sqrt((Math.pow((point.x-point2.x),2))+(Math.pow((point.y-point2.y),2))+(Math.pow((point.y-point2.y),2)) < lowestDist)){
                                            lowestDist = Math.sqrt((Math.pow((point.x-point2.x),2))+(Math.pow((point.y-point2.y),2))+(Math.pow((point.y-point2.y),2)) < lowestDist)
                                            lowestDistPoint = point2
                                        }else{
                                            continue 
                                        } 
                                    })
                                }
                            }
                        }else{
                            while(i-1 > 0){
                                // print("searching from beginning")
                                if(len(octree[i-itrs].rootQuad.points) != 0){
                                    emptyQuad = False
                                    let that = this
                                    octree[i-itrs].rootQuad.points.forEach(function(point2){
                                        //  print(math.sqrt(((point.x-point2.x)**2)+((point.y-point2.y)**2)+((point.y-point2.y)**2)),point2.x,point2.y,point2.z)
                                        if(Math.sqrt((Math.pow((point.x-point2.x),2))+(Math.pow((point.y-point2.y),2))+(Math.pow((point.y-point2.y),2)) < lowestDist)){
                                            lowestDist = Math.sqrt((Math.pow((point.x-point2.x),2))+(Math.pow((point.y-point2.y),2))+(Math.pow((point.y-point2.y),2)) < lowestDist)
                                            lowestDistPoint = point2
                                            }else{
                                                continue 
                                            } 
                                        })
                                    }
                                }
                            }
                        }else{
                            // print("corresponding quad found(After Empty octree[i])")
                            emptyQuad = False
                            let that = this
                            octree[i].rootQuad.points.forEach(function(point2){
                               //  print(math.sqrt(((point.x-point2.x)**2)+((point.y-point2.y)**2)+((point.y-point2.y)**2)),point2.x,point2.y,point2.z)
                                if(Math.sqrt((Math.pow((point.x-point2.x),2))+(Math.pow((point.y-point2.y),2))+(Math.pow((point.y-point2.y),2)) < lowestDist)){
                                    lowestDist = Math.sqrt((Math.pow((point.x-point2.x),2))+(Math.pow((point.y-point2.y),2))+(Math.pow((point.y-point2.y),2)) < lowestDist)
                                    lowestDistPoint = point2
                                }else{
                                    continue 
                                } 
                                break
                            })
                        }
                    }
                    else{
                        // print("changing nested quad")
                        self.closestImageRGB(octree[i].rootQuad.octree[i], point) 
                    }                    
                }
                else{
                    emptyQuad = true
                // print("This parent octree[i] is empty")
                    emptyQuad = true
                    if(i+1 > 8){
                        while(i > 0){
                            self.closestImageRGB(octree[i-1],point)
                        }
                    }
                    else{
                        continue
                    }
                } 
            }

            if(octree[i].rootQuad.boundary.contains(point) == true){
                if(len(octree[i].rootQuad.points) != 0){
                    if(octree[i].rootQuad.isDivided != true){
                       if(len(octree[i].rootQuad.points) == 0){
                            // print("quad was empty finding closest point amoungst neighboring quads")
                            itrs = 0
                        }        
                        if(i-1 > 0 && i+1 <= 8){
                            while(i-1 > 0 && i+1 <= 8){
                                // print("searching from middle")
                                if(len(octree[i-itrs].rootQuad.points) > 0 || len(octree[i+itrs].rootQuad.points) > 0){
                                    mergedPoints = octree[i-1].rootQuad.points + octree[i+1].rootQuad.points
                                    mergedPoints.forEach(function(point2){
                                        // print(math.sqrt(((point.x-point2.x)**2)+((point.y-point2.y)**2)+((point.y-point2.y)**2)),point2.x,point2.y,point2.z)
                                        if(Math.sqrt((Math.pow((point.x-point2.x),2))+(Math.pow((point.y-point2.y),2))+(Math.pow((point.y-point2.y),2)) < lowestDist)){
                                            lowestDist = Math.sqrt((Math.pow((point.x-point2.x),2))+(Math.pow((point.y-point2.y),2))+(Math.pow((point.y-point2.y),2)) < lowestDist)
                                            lowestDistPoint = point2
                                        }else{
                                            continue 
                                        }
                                    })
                                }else{
                                    continue
                                }
                            }      
                        }else if(i-1 < 0){
                            while(i+1 <= 8){
                                // print("searching from end")
                                if(len(octree[i+itrs].rootQuad.points) != 0){
                                    octree[i+itrs].rootQuad.points.forEach(function(point2){
//                                      print(math.sqrt(((point.x-point2.x)**2)+((point.y-point2.y)**2)+((point.y-point2.y)**2)),point2.x,point2.y,point2.z)
                                        if(Math.sqrt((Math.pow((point.x-point2.x),2))+(Math.pow((point.y-point2.y),2))+(Math.pow((point.y-point2.y),2)) < lowestDist)){
                                            lowestDist = Math.sqrt((Math.pow((point.x-point2.x),2))+(Math.pow((point.y-point2.y),2))+(Math.pow((point.y-point2.y),2)) < lowestDist)
                                            lowestDistPoint = point2
                                        }else{
                                            continue 
                                        }
                                    })
                                }
                            }
                        }else{
                            while(i-1 > 0){
                                // print("searching from beginning")
                                if(len(octree[i-itrs].rootQuad.points) != 0){
                                    octree[i-itrs].rootQuad.points.forEach(function(point2){
//                                      print(math.sqrt(((point.x-point2.x)**2)+((point.y-point2.y)**2)+((point.y-point2.y)**2)),point2.x,point2.y,point2.z)
                                        if(Math.sqrt((Math.pow((point.x-point2.x),2))+(Math.pow((point.y-point2.y),2))+(Math.pow((point.y-point2.y),2)) < lowestDist)){
                                            lowestDist = Math.sqrt((Math.pow((point.x-point2.x),2))+(Math.pow((point.y-point2.y),2))+(Math.pow((point.y-point2.y),2)) < lowestDist)
                                            lowestDistPoint = point2
                                        }else{
                                            continue 
                                        }
                                    })
                                }
                            }
                        }
                    }else{
                        // print("corresponding quad found")
                        octree[i].rootQuad.points.forEach(function(point2){
                            // print(math.sqrt(((point.x-point2.x)**2)+((point.y-point2.y)**2)+((point.y-point2.y)**2)),point2.x,point2.y,point2.z)
                            if(Math.sqrt((Math.pow((point.x-point2.x),2))+(Math.pow((point.y-point2.y),2))+(Math.pow((point.y-point2.y),2)) < lowestDist)){
                                lowestDist = Math.sqrt((Math.pow((point.x-point2.x),2))+(Math.pow((point.y-point2.y),2))+(Math.pow((point.y-point2.y),2)) < lowestDist)
                                lowestDistPoint = point2
                            }else{
                                continue 
                            }
                        break
                        })
                    }

                }else{
                    // print("changing nested quad")
                    self.closestImageRGB(octree[i].rootQuad.octree[i], point)                    
                }
            }else{
             // print("This parent octree[i] is empty")
                emptyQuad = true
                if(i+1 > 8){
                    while(i > 0){
                        self.closestImageRGB(octree[i-1],point)
                    }      
                }else{
                    continue
                }                         
            }
        
        }else{
            continue
        }
    }
    lowestDist = 255
    return lowestDistPoint
}
