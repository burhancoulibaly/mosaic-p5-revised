let count = 0
let totPoints = 0
let lowestDist = 442
let lowestDistPoint = null
let containedQuadEmpty = false

class Octree{
    constructor(quad){
        this.rootQuad = quad;
        this.q1 = null;
        this.q2 = null;
        this.q3 = null;
        this.q4 = null;
        this.q5 = null;
        this.q6 = null;
        this.q7 = null;
        this.q8 = null;
    }
    
    getChildren(rootQuad){
        return [rootQuad.q1,rootQuad.q2,rootQuad.q3,rootQuad.q4,rootQuad.q5,rootQuad.q6,rootQuad.q7,rootQuad.q8];
    }

    getTotalPoints(rootNode){
        if(rootNode.rootQuad.isDivided == false){
            count += rootNode.rootQuad.points.length
            return count
        }
        
        let octree = this.getChildren(rootNode)
        
        let that = this
        octree.forEach(function(node){
            if(node.rootQuad.isDivided != true){
                count += node.rootQuad.points.length
            }
            else{
                that.getTotalPoints(node.rootQuad.node)
            }     
        })
        return count
    }

    closestDistance(point, points){
        let closestPoint;

        points.forEach(function(point2){
            if(Math.sqrt((Math.pow((point.x-point2.x),2))+(Math.pow((point.y-point2.y),2))+(Math.pow((point.y-point2.y),2))) < lowestDist){
                Math.sqrt((Math.pow((point.x-point2.x),2))+(Math.pow((point.y-point2.y),2))+(Math.pow((point.y-point2.y),2)))

                closestPoint = point2
            }
        }) 

        return closestPoint;
    }

    findNextClosestCandidate(octree, point, i){
        let closestCandidate;

        if(i-1 < 0){
            let right = i+1;

            while(right < 8){
                if(octree[right].rootQuad.points.length > 0){
                    closestCandidate = this.closestDistance(point, octree[right].rootQuad.points);
                    break;
                }
                right++
            }

        }else if(i+1 >= 8){
            let left = i-1;

            while(left >= 0){
                if(octree[left].rootQuad.points.length > 0){
                    closestCandidate = this.closestDistance(point, octree[left].rootQuad.points);
                    break;
                }
                
                left--
            }
        }else{
            let right = i+1;
            let left = i-1;
            let pointsRight;
            let pointsLeft;

            while(right < 8){
                if(octree[right].rootQuad.points.length > 0){
                    pointsRight = octree[right].rootQuad.points;
                    break;
                }
                
                right++
            }

            while(left >= 0){
                if(octree[left].rootQuad.points.length > 0){
                    pointsLeft = octree[left].rootQuad.points;
                    break;
                }
                
                left--
            }
            
            closestCandidate = this.closestDistance(point, [...(pointsRight ? pointsRight : []),...(pointsLeft ? pointsLeft : [])]);
        }
        
        return closestCandidate;
    }

    closestImageRGB(rootNode,point){
        if(rootNode.rootQuad.isDivided == false){
            lowestDistPoint = this.closestDistance(point, rootNode.rootQuad.points);      
        }else{
            let octree = this.getChildren(rootNode)
        
            for(var i = 0;i < octree.length; i++){
                if(octree[i].rootQuad.boundary.contains(point) == true){
                    // console.log("point is contained in quad");
                        if(octree[i].rootQuad.isDivided != true){
                            
                            // console.log("leaf quad of tree found")
                            if(octree[i].rootQuad.points.length === 0){
                                // console.log("leaf quad was empty finding closest point amoungst neighboring quads");
                                containedQuadEmpty = true

                                lowestDistPoint = this.findNextClosestCandidate(octree, point, i);

                                break;
                            }else{
                                // console.log("corresponding quad found");
                                lowestDistPoint = this.closestDistance(point, octree[i].rootQuad.points);

                                break;
                            }   
                        }else{
                            // console.log("changing nested quad");
                            lowestDistPoint = this.closestImageRGB(octree[i].rootQuad.node, point);

                            if(containedQuadEmpty && !lowestDistPoint){
                                lowestDistPoint = this.findNextClosestCandidate(octree, point, i);
                            }

                            break;
                        }                    
                }else{
                    // console.log("point not contained in quad");
                    continue
                }
            }
        }

        lowestDist = 442
        return lowestDistPoint;
    }
}

class Rectangle{
    constructor(x,y,z,w,h){
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        this.h = h;
    }

    contains(point){
        // console.log(this.x - this.w,">=",point.x,"<=",this.x + this.w)
        // console.log(this.y - this.w,">=",point.y,"<=",this.y + this.w)
        // console.log(this.z - this.h,">=", point.z,"<=",this.z + this.h)
        // console.log(point.x >= this.x - this.w && point.x <= this.x + this.w && point.y >= this.y - this.w && point.y <= this.y + this.w && point.z >= this.z - this.h && point.z <= this.z + this.h)
        return(point.x >= this.x - this.w && point.x <= this.x + this.w && point.y >= this.y - this.w && point.y <= this.y + this.w && point.z >= this.z - this.h && point.z <= this.z + this.h);
    }
}

class Point{
    constructor(x,y,z){
        this.x = x;
        this.y = y;
        this.z = z;
        // console.log(this.x,this.y,this.z)
    }
}

class Quad{
    constructor(boundary,capacity){
        this.points = new Array();
        this.boundary = boundary;
        this.capacity = capacity;
        this.isDivided = false;
        this.node = new Octree(this);
        this.isEmpty = true;
    }

    newPoint(point){
        if(this.boundary.contains(point) != true){
            // console.log("Point not contained")
            return false;
        }

        if(this.points.length < this.capacity){
            // console.log("point added: "+point.x+","+point.y+","+point.z);
            this.points.push(point);
            this.isEmpty = false;
            return true;
        }else{
            if(this.isDivided != true){
                // console.log("Max capacity reached in this quadrant")
                // console.log("this quad has been divided")   
                this.subDivide();
            }

            if(this.node.q1.rootQuad.newPoint(point)){
                return true
            }
            else if(this.node.q2.rootQuad.newPoint(point)){
                return true
            }
            else if(this.node.q3.rootQuad.newPoint(point)){
                return true
            }
            else if(this.node.q4.rootQuad.newPoint(point)){
                return true                   
            }
            else if(this.node.q5.rootQuad.newPoint(point)){
                return true
            }
            else if(this.node.q6.rootQuad.newPoint(point)){
                return true
            }
            else if(this.node.q7.rootQuad.newPoint(point)){
                return true
            }
            else if(this.node.q8.rootQuad.newPoint(point)){
                return true
            }
        }
    }

    subDivide(){
        let x = this.boundary.x
        let y = this.boundary.y
        let z = this.boundary.z
        let w = this.boundary.w
        let h = this.boundary.h

        let q1 = new Rectangle(x + w/2,y+w/2,z+h/2,w/2,h/2)
        this.node.q1 = new Octree(new Quad(q1,this.capacity))
        let q2 = new Rectangle(x - w/2,y+w/2,z+h/2,w/2,h/2)
        this.node.q2 = new Octree(new Quad(q2,this.capacity))
        let q3 = new Rectangle(x + w/2,y+h/2,z-w/2,w/2,h/2)
        this.node.q3 = new Octree(new Quad(q3,this.capacity))
        let q4 = new Rectangle(x - w/2,y+h/2,z-w/2,w/2,h/2)
        this.node.q4 = new Octree(new Quad(q4,this.capacity))

        let q5 = new Rectangle(x + w/2,y-w/2,z+h/2,w/2,h/2)
        this.node.q5 = new Octree(new Quad(q5,this.capacity))
        let q6 = new Rectangle(x - w/2,y-w/2,z+h/2,w/2,h/2)
        this.node.q6 = new Octree(new Quad(q6,this.capacity))
        let q7 = new Rectangle(x + w/2,y-h/2,z-w/2,w/2,h/2)
        this.node.q7 = new Octree(new Quad(q7,this.capacity))
        let q8 = new Rectangle(x - w/2,y-h/2,z-w/2,w/2,h/2)
        this.node.q8 = new Octree(new Quad(q8,this.capacity))

        let that = this;
        that.points.forEach(function(point){
            // console.log("point redistribution")
            if(that.node.q1.rootQuad.boundary.contains((point)) == true){
                that.node.q1.rootQuad.points.push((point));
                that.node.q1.rootQuad.isEmpty = false;
                // console.log("point redistributed to quad1")
            }
            else if(that.node.q2.rootQuad.boundary.contains((point)) == true){
                that.node.q2.rootQuad.points.push((point));
                that.node.q1.rootQuad.isEmpty = false;
                // console.log("point redistributed to quad2")   
            }
            else if(that.node.q3.rootQuad.boundary.contains((point)) == true){
                that.node.q3.rootQuad.points.push((point));
                that.node.q1.rootQuad.isEmpty = false;
                // console.log("point redistributed to quad3")
            }
            else if(that.node.q4.rootQuad.boundary.contains((point)) == true){
                that.node.q4.rootQuad.points.push((point));
                that.node.q1.rootQuad.isEmpty = false;
                // console.log("point redistributed to quad4")
            }
            else if(that.node.q5.rootQuad.boundary.contains((point)) == true){
                that.node.q5.rootQuad.points.push((point));
                that.node.q1.rootQuad.isEmpty = false;
                // console.log("point redistributed to quad5")
            }
            else if(that.node.q6.rootQuad.boundary.contains((point)) == true){
                that.node.q6.rootQuad.points.push((point));
                that.node.q1.rootQuad.isEmpty = false;
                // console.log("point redistributed to quad6")
            }
            else if(that.node.q7.rootQuad.boundary.contains((point)) == true){
                that.node.q7.rootQuad.points.push((point));
                that.node.q1.rootQuad.isEmpty = false;
                // console.log("point redistributed to quad7")
            }  
            else if(that.node.q8.rootQuad.boundary.contains((point)) == true){
                that.node.q8.rootQuad.points.push((point));
                that.node.q1.rootQuad.isEmpty = false;
                // console.log("point redistributed to quad8")
            }
            else{
                console.log("You've made a grave mistake this point goes in none of the quads")
            }
        })
        

        this.isDivided = true
        this.boundary.divCount += 1
    }

}

module.exports = {
    Octree,
    Rectangle,
    Point,
    Quad
}