let changeAnimationTo = function(abject, animation){

        console.log(Object.keys(animation));
        abject.setAnimation(animation);
        abject.w = animation.w;
        abject.h = animation.h;

};



