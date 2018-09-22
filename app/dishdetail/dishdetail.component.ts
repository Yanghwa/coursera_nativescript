import { Component, OnInit, Inject, ViewContainerRef } from '@angular/core';
import { Dish } from '../shared/dish';
import { Comment } from '../shared/comment';
import { DishService } from '../services/dish.service';
import { FavoriteService } from '../services/favorite.service';
import { TNSFontIconService } from 'nativescript-ngx-fonticon';
import { ActivatedRoute, Params } from '@angular/router';
import { Location } from '@angular/common';
import { RouterExtensions } from 'nativescript-angular/router';
import { switchMap } from 'rxjs/operators';
import { Toasty } from 'nativescript-toasty';
import { action } from "ui/dialogs";
import { ModalDialogService, ModalDialogOptions } from "nativescript-angular/modal-dialog";
import { CommentComponent } from '../comment/comment.component';
import { Page } from "ui/page";
import { Animation, AnimationDefinition } from "ui/animation";
import { View } from "ui/core/view";
import { SwipeGestureEventData, SwipeDirection } from "ui/gestures";
import { Color } from 'color';
import * as enums from "ui/enums";
import * as SocialShare from "nativescript-social-share";
import { ImageSource, fromUrl } from "image-source";


@Component({
    selector: 'app-dishdetail',
    moduleId: module.id,
    templateUrl: './dishdetail.component.html',
    styleUrls: ['./dishdetail.component.css']
})
export class DishdetailComponent implements OnInit {
    dish: Dish;
    comment: Comment;
    errMess: string;
    avgstars: string;
    numcomments: number;
    favorite: boolean = false;
    showComments: boolean = false;

    cardImage: View;
    commentList: View;
    cardLayout: View;

    constructor(private dishservice: DishService, private route: ActivatedRoute, private routerExtensions: RouterExtensions,
        @Inject('baseURL') private baseURL, private favoriteservice: FavoriteService, private fonticon: TNSFontIconService,
        private modalService: ModalDialogService, private vcRef: ViewContainerRef, private page: Page) {

    }

    ngOnInit() {
        this.route.params.pipe(switchMap((params: Params) => this.dishservice.getDish(params['id'])))
        .subscribe(dish => {
            this.dish = dish;
            this.favorite = this.favoriteservice.isFavorite(this.dish.id);
            this.numcomments = this.dish.comments.length;

            let total = 0;
            this.dish.comments.forEach(comment => total += comment.rating);
            this.avgstars = (total/this.numcomments).toFixed(2);

        }, errmess => { this.dish = null; this.errMess = <any>errmess;});
    }

    goBack() {
        this.routerExtensions.back();
    }

    addToFavorites() {
        if (!this.favorite) {
            console.log('Adding to Favorites', this.dish.id);
            this.favorite = this.favoriteservice.addFavorite(this.dish.id);
            const toast = new Toasty("Added Dish "+ this.dish.id, "short", "bottom");
            toast.show();
        } else {
            console.log('Deleting from Favorites', this.dish.id);
            this.favorite = !this.favoriteservice.deleteFavorite(this.dish.id);
            const toast = new Toasty("Deleted Dish "+ this.dish.id + " from favorites", "short", "bottom");
            toast.show();
        }
    }

    createModalView() {
        let options: ModalDialogOptions = {
            viewContainerRef: this.vcRef,
            fullscreen: false
        };
        this.modalService.showModal(CommentComponent, options)
            .then((result: Comment) => {
                console.log(result);
                this.dish.comments.push(result);
                this.numcomments = this.dish.comments.length;
                let total = 0;
                this.dish.comments.forEach((comment: Comment) => total += comment.rating);
                this.avgstars = (total/this.numcomments).toFixed(2);
            });
    }

    createAction() {
        let options = {
            title: "menu options",
            cancelButtonText: "Cancel",
            actions: ["Add/Delete a Favorite", "Add comment", "Social Sharing"]
        };
        action(options).then(result => {
            if (result === "Add/Delete a Favorite") {
                this.addToFavorites();
            } else if (result === "Add comment") {  
                console.log('Adding comment');
                this.createModalView();
            } else if (result === 'Social Sharing') {
                this.socialShare();
            }
        });
    }

    onSwipe(args: SwipeGestureEventData) {

        if (this.dish) {
            this.cardImage = <View>this.page.getViewById<View>("cardImage");
            this.cardLayout = <View>this.page.getViewById<View>("cardLayout");
            this.commentList = <View>this.page.getViewById<View>("commentList");

            if (args.direction === SwipeDirection.up && !this.showComments ) {
                this.animateUp();
            } else if (args.direction === SwipeDirection.down && this.showComments ) {
                this.showComments = false;
                this.animateDown();
            }
        }
    
    }
    
    showAndHideComments() {
        this.cardImage = <View>this.page.getViewById<View>("cardImage");
        this.cardLayout = <View>this.page.getViewById<View>("cardLayout");
        this.commentList = <View>this.page.getViewById<View>("commentList");

        if (!this.showComments ) {
            this.animateUp();
        } else if (this.showComments ) {
            this.showComments = false;
            this.animateDown();
        }
    }

    animateUp() {
        let definitions = new Array<AnimationDefinition>();
        let a1: AnimationDefinition = {
            target: this.cardImage,
            scale: { x: 1, y: 0 },
            translate: { x: 0, y: -200 },
            opacity: 0,
            duration: 500,
            curve: enums.AnimationCurve.easeIn
        };
        definitions.push(a1);

        let a2: AnimationDefinition = {
            target: this.cardLayout,
            backgroundColor: new Color("#ffc107"),
            duration: 500,
            curve: enums.AnimationCurve.easeIn
        };
        definitions.push(a2);

        let animationSet = new Animation(definitions);

        animationSet.play().then(() => {
            this.showComments = true;
        })
        .catch((e) => {
            console.log(e.message);
        });
    } 

    animateDown() {
        let definitions = new Array<AnimationDefinition>();
        let a1: AnimationDefinition = {
            target: this.cardImage,
            scale: { x: 1, y: 1 },
            translate: { x: 0, y: 0 },
            opacity: 1,
            duration: 500,
            curve: enums.AnimationCurve.easeIn
        };
        definitions.push(a1);

        let a2: AnimationDefinition = {
            target: this.cardLayout,
            backgroundColor: new Color("#ffffff"),
            duration: 500,
            curve: enums.AnimationCurve.easeIn
        };
        definitions.push(a2);

        let animationSet = new Animation(definitions);

        animationSet.play().then(() => {
        })
        .catch((e) => {
            console.log(e.message);
        });
    }

    socialShare() {
        let image: ImageSource;
    
        fromUrl(this.baseURL + this.dish.image)
            .then((img: ImageSource) => {
                image = img; 
                SocialShare.shareImage(image, "How would you like to share this image?")
            })
            .catch(()=> { console.log('Error loading image'); });
    }

}
