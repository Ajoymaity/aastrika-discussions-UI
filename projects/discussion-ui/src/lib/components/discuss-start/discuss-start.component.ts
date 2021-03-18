import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { DiscussionService } from './../../services/discussion.service';
import { Component, OnInit, ElementRef, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { NSDiscussData } from './../../models/discuss.model';
import { TelemetryUtilsService } from './../../telemetry-utils.service';
/* tslint:disable */
import * as _ from 'lodash'
/* tslint:enable */

@Component({
  selector: 'lib-discuss-start',
  templateUrl: './discuss-start.component.html',
  styleUrls: ['./discuss-start.component.scss']
})
export class DiscussStartComponent implements OnInit {
  @Input() categoryId: string;
  @Input() topicData: any;
  @Input() mode: string;
  @Output() close = new EventEmitter();

  startForm!: FormGroup;
  allCategories!: NSDiscussData.ICategorie[];
  allTags!: NSDiscussData.ITag[];
  postTagsArray: string[] = [];
  uploadSaveData = false;
  showErrorMsg = false;
  createErrorMsg = '';
  defaultError = 'Something went wrong, Please try again after sometime!';

  enableSubmitButton = false;

  constructor(
    private discussService: DiscussionService,
    private formBuilder: FormBuilder,
    private telemetryUtils: TelemetryUtilsService
  ) { }

  ngOnInit() {
    this.telemetryUtils.logImpression(NSDiscussData.IPageName.START);
    this.initializeData();
    this.initializeFormFields(this.topicData);
  }

  initializeFormFields(topicData) {
    this.startForm = this.formBuilder.group({
      question: ['', Validators.required],
      description: ['', Validators.required],
      tags: [],
    });
    this.startForm.valueChanges.subscribe(val => {
      this.validateForm();
    });

    /** If popup is in edit mode */
    if (topicData) {
      const tags = _.map(_.get(topicData, 'tags') , (element) => {
        return _.get(element, 'value');
      });
      this.startForm.controls['question'].setValue(_.get(topicData, 'title'));
      this.startForm.controls['description'].setValue(_.get(topicData, 'posts[0].content').replace(/<[^>]+>/g, ''));
      this.startForm.controls['tags'].setValue(tags);
      this.validateForm();
    }
  }

  validateForm() {
    if (this.startForm.status === 'VALID') {
      this.enableSubmitButton = true;
    } else {
      this.enableSubmitButton = false;
    }
  }

  initializeData() {
    this.discussService.fetchAllTag().subscribe(data => {
      const tags = _.get(data, 'tags');
      this.allTags = _.map(tags, (tag) => tag.value);
    });
  }
  showError(meta: string) {
    if (meta) {
      return true;
    }
    return false;
  }

  public submitPost(form: any) {
    this.uploadSaveData = true;
    this.showErrorMsg = false;
    const postCreateReq = {
      cid: this.categoryId,
      title: form.value.question,
      content: form.value.description,
      tags: form.value.tags,
    };
    this.discussService.createPost(postCreateReq).subscribe(
      () => {
        this.closeModal('success');
        form.reset();
        this.uploadSaveData = false;
        // success toast;
        // this.openSnackbar(this.toastSuccess.nativeElement.value)
        // close the modal
      },
      err => {
        this.closeModal('discard');
        // error toast
        // .openSnackbar(this.toastError.nativeElement.value)
        this.uploadSaveData = false;
        if (err) {
          if (err.error && err.error.message) {
            this.showErrorMsg = true;
            this.createErrorMsg = err.error.message.split('|')[1] || this.defaultError;
          }
        }
      });
  }


  /**
   * @param  {any} form
   * @description - It will emit an event when popup is opened in edit topic/thread mode
   */
  updatePost(form: any) {
    const updateTopicRequest = {
      pid: _.get(this.topicData, 'tid'),
      title: form.value.question,
      content: form.value.description,
      tags: form.value.tags,
    };
    this.close.emit({
      action: 'update',
      request: updateTopicRequest
    });
  }

  closeModal(eventMessage: string) {
    this.close.emit({message: eventMessage});
  }

  logTelemetry(event) {
    this.telemetryUtils.logInteract(event, NSDiscussData.IPageName.START);
  }
}

