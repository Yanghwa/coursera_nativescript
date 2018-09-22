import { Component, OnInit, Inject, ChangeDetectorRef, ViewContainerRef } from '@angular/core';
import { TextField } from 'ui/text-field';
import { Switch } from 'ui/switch';
import { Validators, FormBuilder, FormGroup} from '@angular/forms';
import { ModalDialogService, ModalDialogOptions } from "nativescript-angular/modal-dialog";
import { ReservationModalComponent } from "../reservationmodal/reservationmodal.component";
import { Reservation } from '../shared/reservation';
import { Page } from "ui/page";
import { View } from "ui/core/view";
import { SwipeGestureEventData, SwipeDirection } from "ui/gestures";
import { Animation, AnimationDefinition } from "ui/animation";
import { CouchbaseService } from '../services/couchbase.service';
import * as enums from "ui/enums";

@Component({
    selector: 'app-reservation',
    moduleId: module.id,
    templateUrl: './reservation.component.html',
    styleUrls: ['./reservation.component.css']
})
export class ReservationComponent implements OnInit {

    reservation: FormGroup;
    formView: View;
    feedbackView: View;
    showFeedback: boolean = false;
    newReservation: Reservation;
    reservations: Array<Reservation>;
    docId: string = "reservations";

    constructor(private formBuilder: FormBuilder, private modalService: ModalDialogService, 
        private vcRef: ViewContainerRef,private page: Page, private couchbaseService: CouchbaseService, 
        private changeDetectorRef:ChangeDetectorRef) {
            // this.changeDetectorRef.markForCheck();
            this.reservation = this.formBuilder.group({
                guests: 3,
                smoking: false,
                dateTime: ['', Validators.required]
            });

            this.reservations = [];
            let doc = this.couchbaseService.getDocument(this.docId);
            if (doc == null) {
                this.couchbaseService.createDocument({"reservations": []}, this.docId);
            } else {
                this.reservations = doc.reservations;
            }
    }

    ngOnInit() {

    }

    onSmokingChecked(args) {
        let smokingSwitch = <Switch>args.object;
        if (smokingSwitch.checked) {
            this.reservation.patchValue({ smoking: true });
        }
        else {
            this.reservation.patchValue({ smoking: false });
        }
    }

    onGuestChange(args) {
        let textField = <TextField>args.object;

        this.reservation.patchValue({ guests: textField.text});
    }

    onDateTimeChange(args) {
        let textField = <TextField>args.object;

        this.reservation.patchValue({ dateTime: textField.text});
    }

    onSubmit() {
        console.log(JSON.stringify(this.reservation.value));
        this.newReservation = this.reservation.value;
        this.formView = this.page.getViewById<View>("formView");
        this.feedbackView = this.page.getViewById<View>("feedbackView");

        this.reservations.push(this.newReservation);
        this.couchbaseService.updateDocument(this.docId, {"reservations": this.reservations});

        this.animateSwitch();
    }

    createModalView(args) {

        let options: ModalDialogOptions = {
            viewContainerRef: this.vcRef,
            context: args,
            fullscreen: false
        };

        this.modalService.showModal(ReservationModalComponent, options)
            .then((result: any) => {
                if (args === "guest") {
                    this.reservation.patchValue({guests: result});
                }
                else if (args === "date-time") {
                    this.reservation.patchValue({ dateTime: result});
                }
            });

    }

    animateSwitch() {
        this.formView.animate({
            scale: {x: 0, y: 0},
            opacity: 0,
            duration: 500,
            curve: enums.AnimationCurve.easeIn
        }).then(() => {
            this.feedbackView.animate({
                scale: {x: 0, y: 0},
                opacity: 0,
                duration: 0,
            }).then(() => {
                this.showFeedback = true;
                this.feedbackView.animate({
                    scale: {x: 1, y: 1},
                    opacity: 1,
                    duration: 500,
                    curve: enums.AnimationCurve.easeOut
                });
            });
        });
    }
}