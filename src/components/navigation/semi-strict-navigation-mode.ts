import {NavigationMode} from './navigation-mode.interface';
import {WizardComponent} from '../components/wizard.component';
import {WizardStep} from '../util/wizard-step.interface';
import {MovingDirection} from '../util/moving-direction.enum';
import {WizardCompletionStep} from '../util/wizard-completion-step.inferface';
import {Injectable} from '@angular/core';

/**
 * A [[NavigationMode]], which allows the user to navigate with some limitations.
 * The user can only navigation to a given destination step, if:
 * - the current step can be exited in the direction of the destination step
 * - a completion step can only be entered, if all "normal" wizard steps have been completed
 *
 * @author Marc Arndt
 */
@Injectable()
export class SemiStrictNavigationMode implements NavigationMode {
  /**
   * Constructor
   *
   * @param {WizardComponent} wizard The wizard, that is configured with this navigation mode
   */
  constructor(private wizard: WizardComponent) {
  }

  /**
   * Checks whether the wizard can be transitioned to the given destination step.
   * A destination wizard step can be entered if:
   * - it exists
   * - the current step can be exited in the direction of the destination step
   * - all "normal" wizard steps have been completed or are optional, or the destination step isn't a completion step
   *
   * @param {number} destinationIndex The index of the destination wizard step
   * @returns {boolean} True if the destination wizard step can be entered, false otherwise
   */
  canGoToStep(destinationIndex: number): boolean {
    const movingDirection: MovingDirection = this.wizard.getMovingDirection(destinationIndex);

    const canExit = this.wizard.canExitStep(this.wizard.currentStep, movingDirection);

    const hasStep = this.wizard.hasStep(destinationIndex);

    const allNormalStepsCompleted = this.wizard.wizardSteps
      .filter((step, index) => index < destinationIndex)
      .every(step => step.completed || step.optional);

    const destinationStep: WizardStep = this.wizard.getStepAtIndex(destinationIndex);

    return canExit && hasStep && (!(destinationStep instanceof WizardCompletionStep) || allNormalStepsCompleted);
  }

  /**
   * Tries to enter the wizard step with the given destination index.
   * When entering the destination step, the following actions are done:
   * - the old current step is set as completed
   * - the old current step is set as unselected
   * - the old current step is exited
   * - the destination step is set as selected
   * - the destination step is entered
   *
   * When the destination step couldn't be entered, the following actions are done:
   * - the current step is exited and entered in the direction `MovingDirection.Stay`
   *
   * @param {number} destinationIndex The index of the destination wizard step, which should be entered
   */
  goToStep(destinationIndex: number): void {
    const destinationStep: WizardStep = this.wizard.getStepAtIndex(destinationIndex);

    const movingDirection: MovingDirection = this.wizard.getMovingDirection(destinationIndex);

    // the current step can be exited in the given direction
    if (this.canGoToStep(destinationIndex)) {
      // leave current step
      this.wizard.currentStep.completed = true;
      this.wizard.currentStep.exit(movingDirection);
      this.wizard.currentStep.selected = false;

      this.wizard.currentStepIndex = destinationIndex;
      this.wizard.currentStep = destinationStep;

      // go to next step
      this.wizard.currentStep.enter(movingDirection);
      this.wizard.currentStep.selected = true;
    } else {
      // if the current step can't be left, reenter the current step
      this.wizard.currentStep.exit(MovingDirection.Stay);
      this.wizard.currentStep.enter(MovingDirection.Stay);
    }
  }
}
